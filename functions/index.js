/**
 * Firebase Cloud Functions for PublieDev
 * Algolia sync for publications search
 * Email notifications for publication status changes
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

// Email helper function using admin SDK
// Note: Configure your email service (SendGrid, Mailgun, etc.) here
async function sendEmail(to, subject, htmlBody) {
  try {
    // This is a placeholder for email sending
    // You need to configure an email service like SendGrid, Mailgun, or use
    // Firebase Extensions: https://extensions.dev/extensions/firebase/firestore-send-email
    logger.info(`Email would be sent to: ${to}, Subject: ${subject}`);

    // Example with SendGrid (uncomment and configure):
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: 'noreply@publiedev.com', subject, html: htmlBody });

    // For now, we'll store notifications in Firestore
    await admin.firestore().collection("email_queue").add({
      to,
      subject,
      html: htmlBody,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sent: false,
    });

    return true;
  } catch (error) {
    logger.error("Error queuing email:", error);
    return false;
  }
}

// Algolia configuration
const ALGOLIA_APP_ID = "1JSU865M6S";
const ALGOLIA_WRITE_KEY = "285280399089c8a86599db06ed65ed17";
const ALGOLIA_INDEX_NAME = "publications";

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY);

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

/**
 * Sync publication to Algolia when created
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

      // Send approval email to author
      if (afterData.authorEmail) {
        const emailHtml = `
          <h2>Votre publication a été approuvée ! 🎉</h2>
          <p>Bonjour ${afterData.authorName || ""},</p>
          <p>Nous avons le plaisir de vous informer que votre publication <strong>"${afterData.title}"</strong> a été approuvée par notre comité de lecture.</p>
          <p>Votre publication est maintenant visible sur PublieDev.</p>
          <p><a href="https://publiedev.com/pages/publication.html?slug=${afterData.slug || objectID}" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 12px;">Voir ma publication</a></p>
          <p>Merci de contribuer à la communauté des développeurs !</p>
          <p>L'équipe PublieDev</p>
        `;
        await sendEmail(
          afterData.authorEmail,
          "Votre publication a été approuvée - PublieDev",
          emailHtml,
        );
      }
    } else if (afterData.status === "rejected" && beforeData?.status !== "rejected") {
      // Send rejection email to author
      if (afterData.authorEmail) {
        const rejectionReason = afterData.rejectionReason || "Non spécifiée";
        const emailHtml = `
          <h2>Mise à jour sur votre publication</h2>
          <p>Bonjour ${afterData.authorName || ""},</p>
          <p>Malheureusement, votre publication <strong>"${afterData.title}"</strong> n'a pas été approuvée par notre comité de lecture.</p>
          <p><strong>Raison:</strong> ${rejectionReason}</p>
          <p>Vous pouvez modifier et soumettre à nouveau votre publication après avoir apporté les modifications nécessaires.</p>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <p>L'équipe PublieDev</p>
        `;
        await sendEmail(
          afterData.authorEmail,
          "Mise à jour sur votre publication - PublieDev",
          emailHtml,
        );
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
 * Call this once to populate Algolia with existing data
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
