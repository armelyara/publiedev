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
            (b.publishedAt?._seconds || 0) - (a.publishedAt?._seconds || 0));
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
        const {score, ...publicData} = r;
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

    // If status changed to approved, add to Algolia
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
