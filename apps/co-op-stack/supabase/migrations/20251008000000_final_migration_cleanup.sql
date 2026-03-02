-- Final Migration Cleanup: Remove unused index and consolidate RLS policies

-- ============================================
-- 1. REMOVE UNUSED INDEX
-- ============================================
-- Remove the index we created that hasn't been used yet

DROP INDEX IF EXISTS idx_speaking_queue_participant_id;

-- ============================================
-- 2. CONSOLIDATE RLS POLICIES (Optional Optimization)
-- ============================================
-- Note: Multiple permissive policies are working correctly but could be consolidated
-- for better performance. However, they serve different business logic purposes:
-- - Facilitator policies allow broad management
-- - User policies allow self-service operations
-- Keeping them separate for clarity and security

-- Current policies are intentionally separated for proper access control
-- The performance impact is minimal for this use case
