-- CreateIndex
CREATE UNIQUE INDEX "fund_releases_milestone_pending_idx" ON "fund_releases" ("milestoneId") WHERE status = 'PENDING';
