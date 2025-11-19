/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";

// Initialize Firebase Admin
admin.initializeApp();

// Algolia configuration
const ALGOLIA_APP_ID = "1JSU865M6S";
const ALGOLIA_WRITE_KEY = "285280399089c8a86599db06ed65ed17";
const ALGOLIA_INDEX_NAME = "publications";

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY);
const algoliaIndex = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Sync publication to Algolia when created
 */
export const onPublicationCreated = onDocumentCreated(
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
      await algoliaIndex.saveObject(algoliaRecord);
      logger.info(`Publication indexed in Algolia: ${objectID}`);
    } catch (error) {
      logger.error(`Error indexing publication: ${objectID}`, error);
    }
  }
);

/**
 * Update Algolia when publication is updated
 */
export const onPublicationUpdated = onDocumentUpdated(
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
    // If status changed from approved, remove from Algolia
    if (afterData.status === "approved" && beforeData?.status !== "approved") {
      const algoliaRecord = {
        objectID,
        title: afterData.title || "",
        description: afterData.description || "",
        abstract: afterData.abstract || "",
        content: afterData.content || "",
        type: afterData.type || "",
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
        await algoliaIndex.saveObject(algoliaRecord);
        logger.info(
          `Publication added to Algolia (approved): ${objectID}`
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
        await algoliaIndex.deleteObject(objectID);
        logger.info(
          `Publication removed from Algolia (unapproved): ${objectID}`
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
        await algoliaIndex.partialUpdateObject(algoliaRecord);
        logger.info(`Publication updated in Algolia: ${objectID}`);
      } catch (error) {
        logger.error(`Error updating publication: ${objectID}`, error);
      }
    }
  }
);

/**
 * Remove from Algolia when publication is deleted
 */
export const onPublicationDeleted = onDocumentDeleted(
  "publications/{publicationId}",
  async (event) => {
    const objectID = event.params.publicationId;

    try {
      await algoliaIndex.deleteObject(objectID);
      logger.info(`Publication deleted from Algolia: ${objectID}`);
    } catch (error) {
      logger.error(`Error deleting publication: ${objectID}`, error);
    }
  }
);

/**
 * HTTP function to manually reindex all approved publications
 * Call this once to populate Algolia with existing data
 */
export const reindexAllPublications = onRequest(async (request, response) => {
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
      await algoliaIndex.saveObjects(records);
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
