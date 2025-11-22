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
