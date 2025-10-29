import { mutation } from "./_generated/server";

/**
 * Delete all non-payment dispute cases
 * USE WITH CAUTION - This permanently deletes data
 */
export const deleteNonPaymentDisputes = mutation({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("cases").collect();
    let deleted = 0;

    for (const caseDoc of cases) {
      if (caseDoc.type !== "PAYMENT_DISPUTE") {
        await ctx.db.delete(caseDoc._id);
        deleted++;
        console.log(`Deleted ${caseDoc.type} case: ${caseDoc._id}`);
      }
    }

    console.log(`✅ Total deleted: ${deleted} non-payment cases`);
    return { deleted, message: `Deleted ${deleted} non-payment dispute cases` };
  },
});
