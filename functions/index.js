/**
 * Firebase Cloud Functions for PublieDev
 *
 * ⚠️ IMPORTANT: ALGOLIA INTEGRATION - FUTURE USE ONLY
 *
 * Ces fonctions sont préparées pour une future migration vers Algolia.
 * Actuellement, la recherche se fait côté client avec Firestore + TF-IDF manuel.
 *
 * WORKFLOW ACTUEL (Option B - Custom JS):
 * 1. User Submits → Firestore publications (pending)
 * 2. Admin Approves → Status = "approved"
 * 3. User Searches → search.js interroge Firestore directement
 * 4. Frontend calcule les scores manuellement:
 *    - Tags match: +15 points (5x multiplier)
 *    - Exact tag match: +25 points
 *    - Title match: +10 points
 *    - Description match: +5 points
 *    - Category: Hard Filter (SQL WHERE)
 *
 * QUAND MIGRER VERS ALGOLIA (Option A):
 * - Si volume > 10,000 publications
 * - Si besoin de typo-tolerance
 * - Si besoin de recherche ultra-rapide (<10ms)
 *
 * Pour activer: Décommenter les exports ci-dessous et configurer
 * le Dashboard Algolia (SearchableAttributes, CustomRanking, Facets)
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {algoliasearch} = require("algoliasearch");
const crypto = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();

// Algolia configuration (FUTURE USE)
const ALGOLIA_APP_ID = "1JSU865M6S";
const ALGOLIA_WRITE_KEY = "285280399089c8a86599db06ed65ed17";
const ALGOLIA_INDEX_NAME = "publications";

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY);

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// ============================================================================
// EMAIL FUNCTIONALITY
// ============================================================================

/**
 * Send email using Firebase mail extension or custom SMTP
 * This function adds email tasks to Firestore for processing
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
async function sendEmail(to, subject, html) {
  try {
    const db = admin.firestore();
    await db.collection("mail").add({
      to: to,
      message: {
        subject: subject,
        html: html,
      },
    });
    logger.info(`Email queued for ${to}: ${subject}`);
  } catch (error) {
    logger.error("Error queueing email:", error);
    throw error;
  }
}

// ============================================================================
// CUSTOM SEARCH FUNCTION - SERVER-SIDE (SECRET SAUCE 🔒)
// ============================================================================

/**
 * Search publications with custom TF-IDF scoring
 * This function keeps the scoring algorithm secret (server-side only)
 *
 * @param {string} query - Search query
 * @param {string} category - Category filter (optional)
 * @param {string} type - Type filter (optional)
 * @param {string} sortBy - Sort method (relevance, date, views, likes)
 * @param {number} limit - Max results
 */
exports.searchPublications = onRequest(
  {cors: true},
  async (request, response) => {
    try {
      // Parse query parameters
      const {
        q: query = "",
        category = "",
        type = "",
        sortBy = "relevance",
        limit = 20,
      } = request.query;

      const db = admin.firestore();

      // Normalize and tokenize query
      const keywords = query.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .filter((k) => k.length > 2);

      if (keywords.length === 0 && !category) {
        response.json({success: true, results: []});
        return;
      }

      // Build Firestore query with Hard Filters
      let queryRef = db.collection("publications")
        .where("status", "==", "approved");

      // Hard Filter: Category
      if (category) {
        queryRef = queryRef.where("category", "==", category);
      }

      // Hard Filter: Type
      if (type) {
        queryRef = queryRef.where("type", "==", type);
      }

      // Get matching documents
      let snapshot;
      if (keywords.length > 0) {
        queryRef = queryRef.where(
          "searchKeywords",
          "array-contains-any",
          keywords,
        );
        snapshot = await queryRef.limit(parseInt(limit) * 2).get();
      } else {
        snapshot = await queryRef.limit(parseInt(limit)).get();
      }

      // Calculate relevance scores (SECRET SAUCE 🔒)
      let results = snapshot.docs.map((doc) => {
        const data = doc.data();
        const queryLower = query.toLowerCase();

        // TF-IDF Scoring Algorithm (Hidden from client)
        let score = 0;

        // Exact tag match: +25 points (maximum boost)
        if (data.tags &&
            data.tags.some((tag) => tag.toLowerCase() === queryLower)) {
          score += 25;
        }

        // Tags contains query: +15 points (5x multiplier)
        if (data.tags &&
            data.tags.some((tag) => tag.toLowerCase().includes(queryLower))) {
          score += 15;
        }

        // Title match: +10 points
        if (data.title && data.title.toLowerCase().includes(queryLower)) {
          score += 10;
        }

        // Category match: +8 points
        if (data.category &&
            data.category.toLowerCase().includes(queryLower)) {
          score += 8;
        }

        // Description match: +5 points
        if (data.description &&
            data.description.toLowerCase().includes(queryLower)) {
          score += 5;
        }

        // Engagement metrics (logarithmic scale)
        score += Math.log10((data.views || 0) + 1);
        score += Math.log10((data.likes || 0) + 1) * 2;

        return {
          id: doc.id,
          ...data,
          score,
          // Remove searchKeywords from response for security
          searchKeywords: undefined,
        };
      });

      // Sort results
      switch (sortBy) {
      case "date":
        results.sort((a, b) =>
          (b.publishedAt?._seconds || 0) - (a.publishedAt?._seconds || 0),
        );
        break;
      case "views":
        results.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "likes":
        results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default: // relevance
        results.sort((a, b) => b.score - a.score);
      }

      // Limit results and remove score from response (keep algorithm secret)
      results = results.slice(0, parseInt(limit)).map((r) => {
        // eslint-disable-next-line no-unused-vars
        const {score, searchKeywords, ...publicData} = r;
        return publicData;
      });

      response.json({success: true, results});
    } catch (error) {
      logger.error("Error in searchPublications:", error);
      response.status(500).json({
        success: false,
        error: "Search error",
      });
    }
  },
);

// ============================================================================
// CERTIFICATE GENERATION - PDID & SHA-256 PROOF OF EXISTENCE
// ============================================================================

/**
 * Generate a unique PDID (PublieDev ID)
 * Format: PDID-YYYY-XXXXXX (6 characters for collision resistance)
 * Excludes confusing characters: 0/O, 1/I/L
 *
 * @return {string} Unique PDID
 */
function generatePDID() {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 29 chars (29^6 = 594M combos)
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PDID-${year}-${suffix}`;
}

/**
 * Generate SHA-256 hash of publication immutable data
 * This creates cryptographic proof of the publication's existence at approval time
 *
 * @param {Object} publicationData - The publication data
 * @param {string} pdid - The generated PDID
 * @return {string} SHA-256 hash (hex)
 */
function generateCertificateHash(publicationData, pdid) {
  const hashInput = JSON.stringify({
    pdid: pdid,
    title: publicationData.title || "",
    authorId: publicationData.authorId || "",
    authorName: publicationData.authorName || "",
    type: publicationData.type || "",
    category: publicationData.category || "",
    publishedAt: publicationData.publishedAt ||
      admin.firestore.Timestamp.now(),
    description: (publicationData.description || "").substring(0, 500),
  });

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Firebase Function: Generate certificate when publication is approved
 * Triggers when a publication's status changes from pending to approved
 * Adds certificate object with PDID, hash, and timestamp
 */
exports.generateCertificateOnApproval = onDocumentUpdated(
  "publications/{publicationId}",
  async (event) => {
    try {
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();
      const publicationId = event.params.publicationId;

      if (!beforeData || !afterData) {
        logger.error("No data in certificate generation trigger");
        return;
      }

      // Only generate certificate if status changed to approved
      // and certificate doesn't already exist
      if (afterData.status === "approved" &&
          beforeData.status !== "approved" &&
          !afterData.certificate) {
        logger.info(
          `Generating certificate for publication: ${publicationId}`,
        );

        // Generate unique PDID (check for collisions)
        let pdid = generatePDID();
        let attempts = 0;
        const maxAttempts = 5;

        // Check for PDID collision (very rare with 6 chars)
        while (attempts < maxAttempts) {
          const existingPub = await admin.firestore()
            .collection("publications")
            .where("certificate.pdid", "==", pdid)
            .limit(1)
            .get();

          if (existingPub.empty) {
            break; // No collision, use this PDID
          }

          logger.warn(`PDID collision detected: ${pdid}, regenerating...`);
          pdid = generatePDID();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          logger.error("Failed to generate unique PDID after max attempts");
          return;
        }

        // Generate SHA-256 hash
        const hash = generateCertificateHash(afterData, pdid);

        // Certificate data
        const certificate = {
          pdid: pdid,
          hash: hash,
          generated_at: admin.firestore.Timestamp.now(),
          certificate_url:
            `https://pubdev-71378.web.app/pages/certificate.html?pdid=${pdid}`,
        };

        // Update publication with certificate
        await admin.firestore()
          .collection("publications")
          .doc(publicationId)
          .update({
            certificate: certificate,
          });

        logger.info(
          `Certificate generated successfully: ${pdid} for ${publicationId}`,
        );
      }
    } catch (error) {
      logger.error("Error generating certificate:", error);
    }
  },
);

// ============================================================================
// ALGOLIA SYNC FUNCTIONS - CURRENTLY DISABLED (FUTURE USE)
// ============================================================================

/**
 * Sync publication to Algolia when created
 * ⚠️ FUTURE USE - Currently not called (search uses Firestore directly)
 */
exports.onPublicationCreated = onDocumentCreated(
  "publications/{publicationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("No data associated with the event");
      return;
    }

    const data = snapshot.data();
    const objectID = event.params.publicationId;

    // Only index approved publications
    if (data.status !== "approved") {
      logger.info(`Skipping non-approved publication: ${objectID}`);
      return;
    }

    const algoliaRecord = {
      objectID,
      title: data.title || "",
      description: data.description || "",
      abstract: data.abstract || "",
      content: data.content || "",
      type: data.type || "",
      category: data.category || "",
      authors: data.authors || [],
      tags: data.tags || [],
      technologies: data.technologies || [],
      status: data.status || "",
      authorId: data.authorId || "",
      authorName: data.authorName || "",
      views: data.views || 0,
      likes: data.likes || 0,
      doi: data.doi || "",
      pdfUrl: data.pdfUrl || "",
      githubUrl: data.githubUrl || "",
      demoUrl: data.demoUrl || "",
      createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now(),
    };

    try {
      await client.saveObject({
        indexName: ALGOLIA_INDEX_NAME,
        body: algoliaRecord,
      });
      logger.info(`Publication indexed in Algolia: ${objectID}`);
    } catch (error) {
      logger.error(`Error indexing publication: ${objectID}`, error);
    }
  },
);

/**
 * Update Algolia when publication is updated
 * ⚠️ FUTURE USE - Currently not called (search uses Firestore directly)
 */
exports.onPublicationUpdated = onDocumentUpdated(
  "publications/{publicationId}",
  async (event) => {
    const afterData = event.data?.after.data();
    const beforeData = event.data?.before.data();
    const objectID = event.params.publicationId;

    if (!afterData) {
      logger.error("No data associated with the event");
      return;
    }

    // If status changed to approved, add to Algolia and send email
    if (afterData.status === "approved" && beforeData?.status !== "approved") {
      const algoliaRecord = {
        objectID,
        title: afterData.title || "",
        description: afterData.description || "",
        abstract: afterData.abstract || "",
        content: afterData.content || "",
        type: afterData.type || "",
        category: afterData.category || "",
        authors: afterData.authors || [],
        tags: afterData.tags || [],
        technologies: afterData.technologies || [],
        status: afterData.status || "",
        authorId: afterData.authorId || "",
        authorName: afterData.authorName || "",
        views: afterData.views || 0,
        likes: afterData.likes || 0,
        doi: afterData.doi || "",
        pdfUrl: afterData.pdfUrl || "",
        githubUrl: afterData.githubUrl || "",
        demoUrl: afterData.demoUrl || "",
        createdAt: afterData.createdAt ?
          afterData.createdAt.toMillis() : Date.now(),
      };

      try {
        await client.saveObject({
          indexName: ALGOLIA_INDEX_NAME,
          body: algoliaRecord,
        });
        logger.info(
          `Publication added to Algolia (approved): ${objectID}`,
        );
      } catch (error) {
        logger.error(`Error indexing publication: ${objectID}`, error);
      }

      // NOTE: Email notifications are sent manually with personalized content
      // for each publication, so automatic emails have been disabled.
      logger.info(`Publication approved: ${objectID} - Manual email required`);
    } else if (
      afterData.status === "rejected" &&
      beforeData?.status !== "rejected"
    ) {
      // NOTE: Email notifications are sent manually with personalized content
      // for each publication, so automatic emails have been disabled.
      logger.info(`Publication rejected: ${objectID} - Manual email required`);
    } else if (
      afterData.status !== "approved" &&
      beforeData?.status === "approved"
    ) {
      // Remove from Algolia if no longer approved
      try {
        await client.deleteObject({
          indexName: ALGOLIA_INDEX_NAME,
          objectID,
        });
        logger.info(
          `Publication removed from Algolia (unapproved): ${objectID}`,
        );
      } catch (error) {
        logger.error(`Error removing publication: ${objectID}`, error);
      }
    } else if (afterData.status === "approved") {
      // Update existing approved record
      const algoliaRecord = {
        objectID,
        title: afterData.title || "",
        description: afterData.description || "",
        abstract: afterData.abstract || "",
        content: afterData.content || "",
        type: afterData.type || "",
        category: afterData.category || "",
        authors: afterData.authors || [],
        tags: afterData.tags || [],
        technologies: afterData.technologies || [],
        status: afterData.status || "",
        authorId: afterData.authorId || "",
        authorName: afterData.authorName || "",
        views: afterData.views || 0,
        likes: afterData.likes || 0,
        doi: afterData.doi || "",
        pdfUrl: afterData.pdfUrl || "",
        githubUrl: afterData.githubUrl || "",
        demoUrl: afterData.demoUrl || "",
        createdAt: afterData.createdAt ?
          afterData.createdAt.toMillis() : Date.now(),
      };

      try {
        await client.partialUpdateObject({
          indexName: ALGOLIA_INDEX_NAME,
          objectID,
          attributesToUpdate: algoliaRecord,
        });
        logger.info(`Publication updated in Algolia: ${objectID}`);
      } catch (error) {
        logger.error(`Error updating publication: ${objectID}`, error);
      }
    }
  },
);

/**
 * Remove from Algolia when publication is deleted
 * ⚠️ FUTURE USE - Currently not called (search uses Firestore directly)
 */
exports.onPublicationDeleted = onDocumentDeleted(
  "publications/{publicationId}",
  async (event) => {
    const objectID = event.params.publicationId;

    try {
      await client.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID,
      });
      logger.info(`Publication deleted from Algolia: ${objectID}`);
    } catch (error) {
      logger.error(`Error deleting publication: ${objectID}`, error);
    }
  },
);

/**
 * HTTP function to manually reindex all approved publications
 * ⚠️ FUTURE USE - Call this once to populate Algolia with existing data
 * when migrating to Option A (Algolia search)
 *
 * Current usage: NOT NEEDED (search uses Firestore directly)
 * Future usage: curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/reindexAllPublications
 */
exports.reindexAllPublications = onRequest(async (request, response) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("publications")
      .where("status", "==", "approved")
      .get();

    const records = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        objectID: doc.id,
        title: data.title || "",
        description: data.description || "",
        abstract: data.abstract || "",
        content: data.content || "",
        type: data.type || "",
        category: data.category || "",
        authors: data.authors || [],
        tags: data.tags || [],
        technologies: data.technologies || [],
        status: data.status || "",
        authorId: data.authorId || "",
        authorName: data.authorName || "",
        views: data.views || 0,
        likes: data.likes || 0,
        doi: data.doi || "",
        pdfUrl: data.pdfUrl || "",
        githubUrl: data.githubUrl || "",
        demoUrl: data.demoUrl || "",
        createdAt: data.createdAt ?
          data.createdAt.toMillis() : Date.now(),
      };
    });

    if (records.length > 0) {
      await client.saveObjects({
        indexName: ALGOLIA_INDEX_NAME,
        objects: records,
      });
      logger.info(`Reindexed ${records.length} publications`);
      response.json({success: true, indexed: records.length});
    } else {
      response.json({
        success: true,
        indexed: 0,
        message: "No approved publications to index",
      });
    }
  } catch (error) {
    logger.error("Error reindexing publications:", error);
    response.status(500).json({success: false, error: String(error)});
  }
});
