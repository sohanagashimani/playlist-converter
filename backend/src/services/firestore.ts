import { firestore } from "./firebase";

class FirestoreService {
  async createConversionJob(data: any): Promise<string | null> {
    try {
      const docRef = await firestore.collection("conversion-jobs").add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error("❌ Failed to create conversion job:", error);
      return null;
    }
  }

  async storeConversionData(conversionId: string, data: any): Promise<boolean> {
    try {
      await firestore
        .collection("conversion-jobs")
        .doc(conversionId)
        .set(
          {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );

      return true;
    } catch (error) {
      console.error("❌ Failed to store conversion data:", error);
      return false;
    }
  }

  async getConversionData(conversionId: string): Promise<any | null> {
    try {
      const doc = await firestore
        .collection("conversion-jobs")
        .doc(conversionId)
        .get();

      if (!doc.exists) return null;

      const data = doc.data();
      return {
        ...data,
        createdAt: data?.createdAt?.toDate().toISOString(),
        updatedAt: data?.updatedAt?.toDate().toISOString(),
      };
    } catch (error) {
      console.error("❌ Failed to get conversion data:", error);
      return null;
    }
  }

  async updateConversionStatus(
    conversionId: string,
    status: string,
    progress: number = 0,
    result?: any
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        progress,
        updatedAt: new Date(),
      };

      if (result) {
        updateData.result = result;
      }

      await firestore
        .collection("conversion-jobs")
        .doc(conversionId)
        .set(updateData, { merge: true });
      return true;
    } catch (error) {
      console.error("❌ Failed to update conversion status:", error);
      return false;
    }
  }

  async getAllConversions(): Promise<any[]> {
    try {
      const snapshot = await firestore
        .collection("conversion-jobs")
        .orderBy("createdAt", "desc")
        .limit(100) // Limit to last 100 conversions
        .get();

      const conversions: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        conversions.push({
          ...data,
          conversionId: doc.id,
          createdAt: data.createdAt?.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString(),
        });
      });

      return conversions;
    } catch (error) {
      console.error("❌ Failed to get all conversions:", error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await firestore.collection("health").limit(1).get();
      return true;
    } catch {
      return false;
    }
  }

  async addActiveJob(conversionId: string): Promise<boolean> {
    try {
      await firestore
        .collection("active-jobs")
        .doc(conversionId)
        .set({
          conversionId,
          startedAt: new Date(),

          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        });

      return true;
    } catch (error) {
      console.error("❌ Failed to add active job:", error);
      return false;
    }
  }

  async removeActiveJob(conversionId: string): Promise<boolean> {
    try {
      await firestore.collection("active-jobs").doc(conversionId).delete();
      return true;
    } catch (error) {
      console.error("❌ Failed to remove active job:", error);
      return false;
    }
  }

  async getActiveJobsCount(): Promise<number> {
    try {
      await this.cleanupExpiredJobs();

      const snapshot = await firestore.collection("active-jobs").get();
      if (snapshot.empty) return 0;
      return snapshot.size;
    } catch (error) {
      console.error("❌ Failed to get active jobs count:", error);
      return 0;
    }
  }

  async getActiveJobs(): Promise<string[]> {
    try {
      await this.cleanupExpiredJobs();

      const snapshot = await firestore.collection("active-jobs").get();
      const jobs: string[] = [];
      snapshot.forEach((doc: any) => {
        jobs.push(doc.data().conversionId);
      });

      return jobs;
    } catch (error) {
      console.error("❌ Failed to get active jobs:", error);
      return [];
    }
  }

  private async cleanupExpiredJobs(): Promise<void> {
    try {
      const now = new Date();
      const expiredJobsQuery = firestore
        .collection("active-jobs")
        .where("expiresAt", "<=", now);

      const snapshot = await expiredJobsQuery.get();

      if (snapshot.empty) return;

      const batch = firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${snapshot.size} expired jobs`);
    } catch (error) {
      console.error("❌ Failed to cleanup expired jobs:", error);
    }
  }
}

export default new FirestoreService();
