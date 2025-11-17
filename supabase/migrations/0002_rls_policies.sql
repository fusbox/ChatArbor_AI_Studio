-- Enable Row-Level Security for all relevant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;

-- == CHAT HISTORY & MESSAGES (User-Specific Data) ==
-- 1. Allow logged-in users to read their own history.
--    (Guests are blocked as auth.uid() is null for them).
CREATE POLICY "Allow read access to own chat history"
ON chat_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow read access to own messages"
ON messages FOR SELECT
USING (chat_log_id IN (SELECT id FROM chat_logs WHERE user_id = auth.uid()));

-- 2. Allow guests to create messages with a null user_id,
--    and authenticated users to create messages with their own user_id.
CREATE POLICY "Allow insert for guests and authenticated users"
ON chat_logs FOR INSERT
WITH CHECK ((auth.role() = 'anon' AND user_id IS NULL) OR (auth.role() = 'authenticated' AND user_id = auth.uid()));

CREATE POLICY "Allow insert for guests and authenticated users on messages"
ON messages FOR INSERT
WITH CHECK (
  (auth.role() = 'anon' AND (SELECT user_id FROM chat_logs WHERE id = chat_log_id) IS NULL) OR
  (auth.role() = 'authenticated' AND (SELECT user_id FROM chat_logs WHERE id = chat_log_id) = auth.uid())
);

-- 3. Deny all UPDATE and DELETE operations.
CREATE POLICY "Deny all updates on chat history"
ON chat_logs FOR UPDATE
USING (false);

CREATE POLICY "Deny all deletions on chat history"
ON chat_logs FOR DELETE
USING (false);

CREATE POLICY "Deny all updates on messages"
ON messages FOR UPDATE
USING (false);

CREATE POLICY "Deny all deletions on messages"
ON messages FOR DELETE
USING (false);

-- == FEEDBACK (Write-Only Data) ==
-- 1. Allow both guests and logged-in users to submit feedback.
CREATE POLICY "Allow insert for guests and authenticated users"
ON feedback FOR INSERT
WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- 2. Deny all SELECT, UPDATE, and DELETE operations.
CREATE POLICY "Deny read access on feedback"
ON feedback FOR SELECT
USING (false);

CREATE POLICY "Deny update access on feedback"
ON feedback FOR UPDATE
USING (false);

CREATE POLICY "Deny delete access on feedback"
ON feedback FOR DELETE
USING (false);

-- == ADMIN-CONTROLLED DATA (Secure by Default) ==
-- Deny all client-side access to these tables.
-- All RAG queries will be handled by a secure backend function or service role key.
CREATE POLICY "Deny all access to knowledge sources"
ON knowledge_sources FOR ALL
USING (false);

CREATE POLICY "Deny all access to document chunks"
ON document_chunks FOR ALL
USING (false);

CREATE POLICY "Deny all access to greetings"
ON greetings FOR ALL
USING (false);

-- Note: We assume system_prompt is also a protected table,
-- though it wasn't explicitly mentioned in the RLS section.
-- If it exists, it should also be locked down.
-- CREATE POLICY "Deny all access to system_prompt"
-- ON system_prompt FOR ALL
-- USING (false);
