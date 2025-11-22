# RAG Quality Testing Guide

## Overview

The **RAG Quality Tester** is an admin panel tool that helps you evaluate the quality of your knowledge base retrieval system. It allows you to test queries and see exactly which sources are being retrieved and how relevant they are.

## Location

Access the RAG Quality Tester from the Admin Dashboard:
1. Navigate to the Admin panel (admin icon in header)
2. Click the "RAG Quality" tab (second tab, with bar chart icon)

## Features

### 1. Test Query Interface
- Enter any user question to test what knowledge base sources would be retrieved
- Real-time search shows exactly what the AI assistant would see
- Simulates actual RAG (Retrieval-Augmented Generation) behavior

### 2. Similarity Scores
Each retrieved source displays:
- **Similarity percentage** (0-100%): How relevant the source is to the query
- **Visual similarity bar**: Color-coded for quick assessment
  - Green (≥80%): High relevance
  - Yellow (60-79%): Medium relevance
  - Red (<60%): Low relevance
- **Ranking**: Sources ordered by relevance (most relevant first)

### 3. Quality Metrics Summary
After each search, view aggregate metrics:
- **Average Similarity**: Overall retrieval quality for the query
- **High Relevance Count**: How many sources scored ≥80%
- **Low Relevance Count**: How many sources scored <60%

### 4. Content Preview
For each retrieved source, see:
- Source type (text, URL, file)
- Indexed status (green dot = indexed, gray = not indexed)
- Content preview (first few lines)
- Source metadata (ID, creation date)

### 5. Search History
- Automatically tracks your last 10 test queries
- Shows result count for each query
- Click any previous query to re-run it

## How to Use

### Basic Testing
1. Enter a test query (e.g., "How do I write a resume?")
2. Click "Test Query"
3. Review the retrieved sources and their similarity scores
4. Verify that the right content is being surfaced

### Evaluating Quality

**Good Retrieval Quality:**
- Average similarity ≥ 70%
- Most sources in "High Relevance" range
- Retrieved content directly answers the query

**Poor Retrieval Quality:**
- Average similarity < 50%
- Many sources in "Low Relevance" range
- Retrieved content is off-topic or tangential

### Troubleshooting Low Quality

If retrieval quality is poor:

1. **Check if sources are indexed**
   - Unindexed sources (gray dot) won't retrieve well
   - Go to Knowledge Base tab and click "Re-Index Knowledge Base"

2. **Verify content relevance**
   - Are your KB sources actually related to common user queries?
   - Consider adding more diverse content

3. **Test edge cases**
   - Try queries with different phrasings
   - Test domain-specific terminology
   - Verify acronyms and abbreviations work

4. **Review similarity threshold**
   - Current threshold: 0.5 (50%)
   - Sources below this aren't retrieved
   - Consider if threshold needs adjustment for your use case

## Technical Details

### How Similarity is Calculated

1. **Query embedding**: Your test query is converted to a 768-dimensional vector using the same embedding model as production
2. **Source embeddings**: Each KB source has a pre-computed embedding vector
3. **Cosine similarity**: Similarity score = cosine of angle between query and source vectors
4. **Filtering**: Only sources with similarity > 0.5 are returned
5. **Ranking**: Sources sorted by similarity (highest first)
6. **Top K**: Maximum 5 sources returned

### Current Implementation
- **Embedding Model**: Simulated 768-dimensional vectors (production would use Google Gemini text-embedding-004)
- **Vector Storage**: Browser localStorage (production would use vector database like ChromaDB/Pinecone)
- **Search Algorithm**: Cosine similarity with threshold filtering

### Switching to ChromaDB (Optional)
When you enable ChromaDB, the app will:
- Index KB sources to a Chroma collection on add/edit
- Delete from Chroma on KB delete
- Route all similarity search (including this tester) through Chroma

Setup steps:
1. Start Chroma (recommended: Docker)
   - Docker Desktop on Windows: 
     ```powershell
     docker run -p 8000:8000 ghcr.io/chromadb/chromadb:latest
     ```
2. Create `.env.local` at the project root with:
   ```env
   VITE_USE_CHROMA=true
   VITE_CHROMA_URL=http://localhost:8000
   VITE_CHROMA_COLLECTION=knowledge_sources
   ```
3. Restart the dev server:
   ```powershell
   npm run dev
   ```

Notes:
- Collection is auto-created (cosine metric) if it does not exist.
- No other code changes required; the service layer switches automatically.
- If Chroma is unreachable, the app falls back to the mock local search.

## Future Enhancements

When migrating to production vector database:

1. **Real-time indexing**: Sources automatically indexed on upload
2. **Advanced filters**: Filter by source type, date range, metadata
3. **Batch testing**: Test multiple queries from CSV/JSON file
4. **Historical analytics**: Track retrieval quality over time
5. **A/B testing**: Compare different embedding models or threshold values
6. **Metadata filtering**: Combine semantic search with structured filters

## Related Documentation

- [Knowledge Base Manager](./KNOWLEDGE_BASE.md) - Managing KB sources
- [Evaluation Framework](../evaluation/README.md) - Automated evaluation
- [Vector DB Architecture](./VECTOR_DB_ARCHITECTURE.md) - Production migration plan

## Support

For issues or questions:
1. Check that Knowledge Base is not empty
2. Ensure sources are indexed (green dots)
3. Verify test query is in English and well-formed
4. Review console for any error messages
