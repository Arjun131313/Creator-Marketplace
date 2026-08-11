-- Public application counts for open jobs.
--
-- applications RLS only lets a creator read their own rows and a brand read
-- rows on their own jobs, so the public Campaigns page can't count applicants
-- directly. This function returns aggregate counts only (never pitch,
-- creator_id, proposed_rate, or any row data) and only for jobs that are
-- currently open, so it's safe to expose to anonymous visitors.
CREATE OR REPLACE FUNCTION public.job_application_counts(job_ids uuid[])
RETURNS TABLE (job_id uuid, application_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT a.job_id, count(*) AS application_count
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  WHERE a.job_id = ANY (job_ids)
    AND j.status = 'open'
  GROUP BY a.job_id;
$$;

GRANT EXECUTE ON FUNCTION public.job_application_counts(uuid[]) TO anon, authenticated;
