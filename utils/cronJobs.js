const cron = require('node-cron');
const db = require('../database/db');

/**
 * Core logic to calculate fines.
 * Extracted so it can be called by both internal cron and HTTP endpoint (Vercel).
 */
async function calculateDailyFines() {
    return new Promise((resolve, reject) => {
        db.get("SELECT value FROM settings WHERE key = 'daily_fine_rate'", [], (err, setting) => {
            if (err) return reject(err);
            
            const fineRate = parseFloat(setting?.value || 50);
            
            // 1. Mark active borrowings as overdue if due_date has passed
            const markOverdueQuery = `
                UPDATE borrowings 
                SET status = 'overdue' 
                WHERE status = 'active' AND due_date < CURRENT_TIMESTAMP
            `;
            
            db.run(markOverdueQuery, [], (err) => {
                if (err) return reject(err);
                
                // 2. Increment fines for all overdue items
                const incrementFinesQuery = `
                    UPDATE borrowings 
                    SET fine_amount = fine_amount + ? 
                    WHERE status = 'overdue' AND return_date IS NULL
                `;
                
                db.run(incrementFinesQuery, [fineRate], function(err) {
                    if (err) return reject(err);
                    console.log(`[CRON] Daily fines updated. Affected: ${this.changes}`);
                    resolve(this.changes);
                });
            });
        });
    });
}

/**
 * Daily Cron Job to calculate and update fines for overdue books.
 * Runs every day at 00:00 (Midnight) locally.
 */
function initCronJobs() {
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running daily fine calculation...');
        try {
            await calculateDailyFines();
        } catch (err) {
            console.error('[CRON] Error:', err);
        }
    });
}

module.exports = { initCronJobs, calculateDailyFines };
