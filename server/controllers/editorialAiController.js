const Article = require('../models/Article');
const Category = require('../models/Category');

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string') return response.output_text;
  return (response.output || [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content || [])
    .filter((part) => part.type === 'output_text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n');
};

const extractWebSources = (response) => {
  const annotations = (response.output || []).flatMap((item) =>
    (item.content || []).flatMap((part) => part.annotations || [])
  );
  const seen = new Set();
  return annotations
    .filter((item) => item.type === 'url_citation' && item.url_citation?.url)
    .map((item) => ({
      title: item.url_citation.title || item.url_citation.url,
      url: item.url_citation.url,
    }))
    .filter((source) => {
      if (seen.has(source.url)) return false;
      seen.add(source.url);
      return true;
    })
    .slice(0, 15);
};

const isHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const createResearchDraft = async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      message: 'The newsroom AI is not configured yet. Add OPENAI_API_KEY to the private server environment.',
    });
  }

  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
  if (!topic || topic.length > 3000) {
    return res.status(400).json({
      success: false,
      message: 'Enter a research topic between 1 and 3,000 characters.',
    });
  }

  try {
    const categories = await Category.find({ isActive: true }).select('name').lean();
    const categoryNames = categories.map((item) => item.name).filter(Boolean);
    if (categoryNames.length === 0) {
      return res.status(503).json({ success: false, message: 'Create at least one active newsroom category first.' });
    }

    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        excerpt: { type: 'string' },
        content: { type: 'string' },
        category: { type: 'string', enum: categoryNames },
        tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      },
      required: ['title', 'excerpt', 'content', 'category', 'tags'],
    };

    const instructions = [
      'You are the research and editorial drafting assistant for Rwanda Today, an independent digital newspaper focused on Rwanda and international news.',
      'Research the topic using the web_search tool. Prefer primary sources, official documents, public statements and reputable news organizations.',
      'Use only facts supported by the sources you actually open. Verify names, dates, locations, figures and quotations. Never invent quotations, sources, eyewitness accounts or facts.',
      'Clearly distinguish confirmed facts from allegations, estimates and analysis. If reliable evidence is insufficient, explain the uncertainty in the article rather than guessing.',
      'Write original, balanced reporting in clear English. Do not copy or closely paraphrase any one publisher.',
      'Write a strong factual headline, a short factual excerpt and a complete article with paragraphs separated by blank lines.',
      'Choose exactly one category from this active newsroom category list: ' + categoryNames.join(', ') + '.',
      'The output must be JSON matching the supplied schema. Do not include Markdown fences.',
      'The application attaches the web-search citations returned by the tool as the draft source references. Do not invent source URLs.',
      'This is an unpublished editorial draft. Never state or imply that it has been published.',
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-6-luna',
        instructions,
        input: topic,
        tools: [{ type: 'web_search' }],
        text: {
          format: {
            type: 'json_schema',
            name: 'rwanda_today_article_draft',
            strict: true,
            schema,
          },
        },
        max_output_tokens: 4000,
        store: false,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      return res.status(response.status === 429 ? 503 : 502).json({
        success: false,
        message: response.status === 429
          ? 'The AI provider is rate-limited or the API account has reached its usage limit. Try again later.'
          : 'The newsroom AI could not complete the research request. Check the private API configuration and try again.',
      });
    }

    const result = await response.json();
    const outputText = extractOutputText(result);
    let draft;
    try {
      draft = JSON.parse(outputText);
    } catch {
      return res.status(502).json({ success: false, message: 'The AI returned an unreadable draft. Please try again.' });
    }

    const category = categoryNames.find((name) => name === draft.category);
    const sources = extractWebSources(result);
    if (
      typeof draft.title !== 'string' || !draft.title.trim() || draft.title.length > 180 ||
      typeof draft.excerpt !== 'string' || !draft.excerpt.trim() || draft.excerpt.length > 320 ||
      typeof draft.content !== 'string' || !draft.content.trim() || draft.content.length > 100000 ||
      !category ||
      !Array.isArray(draft.tags) || draft.tags.length > 20 ||
      !sources.length || sources.some((source) => !isHttpUrl(source.url))
    ) {
      return res.status(502).json({
        success: false,
        message: 'The research did not produce a complete article with verifiable web citations. Try a more specific topic.',
      });
    }

    const article = await Article.create({
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      content: draft.content.trim(),
      category,
      author: 'Rwanda Today Editorial Desk',
      tags: draft.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim().slice(0, 40)).filter(Boolean),
      sources,
      status: 'draft',
      isFeatured: false,
      homepageOrder: 0,
      isBreakingNews: false,
      publishedAt: null,
      scheduledAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Research completed and saved as an unpublished draft. Review every source and claim before publishing.',
      article: {
        id: article._id.toString(),
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        status: article.status,
        sources: article.sources,
        createdAt: article.createdAt,
      },
    });
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({
      success: false,
      message: timedOut
        ? 'The research request took too long. Try a narrower topic.'
        : 'The newsroom AI could not complete this request.',
    });
  }
};

module.exports = { createResearchDraft };
