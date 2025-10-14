// src/utils/autoSummary.ts

/**
 * 日本語コンテンツから自動的に要約を生成
 * 半角・全角スペース、改行を除去し、適切な文字数で切り詰める
 */
export function generateAutoSummary(
  content: string, 
  maxLength: number = 120,
  suffix: string = '…'
): string {
  // 1. Markdownとタグを除去
  let cleanContent = content
    // Markdownの見出し除去
    .replace(/#{1,6}\s+/g, '')
    // Markdownリンク除去 [テキスト](URL) → テキスト
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 太字除去 **テキスト** → テキスト
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // イタリック除去 *テキスト* → テキスト
    .replace(/\*([^*]+)\*/g, '$1')
    // インラインコード除去 `コード` → コード
    .replace(/`([^`]+)`/g, '$1')
    // HTMLタグ除去
    .replace(/<[^>]*>/g, '')
    // コードブロック除去
    .replace(/```[\s\S]*?```/g, '')
    // 引用除去
    .replace(/^>\s+/gm, '')
    // リスト記号除去
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '');

  // 2. スペースと改行を除去
  cleanContent = cleanContent
    // 半角スペース除去
    .replace(/\s/g, '')
    // 全角スペース除去
    .replace(/　/g, '')
    // 改行除去
    .replace(/\r?\n/g, '')
    // タブ除去
    .replace(/\t/g, '');

  // 3. 空の場合は空文字を返す
  if (!cleanContent.trim()) {
    return '';
  }

  // 4. 指定文字数以下の場合はそのまま返す
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  // 5. 文字数制限で切り詰める
  let summary = cleanContent.substring(0, maxLength);
  
  // 6. 日本語の句読点で自然に区切る
  const punctuations = ['。', '！', '？', '、'];
  let bestCutPoint = -1;
  let bestPunctuationIndex = -1;

  // 最も適切な区切り点を探す（後ろから検索）
  for (let i = 0; i < punctuations.length; i++) {
    const punctuation = punctuations[i];
    const lastIndex = summary.lastIndexOf(punctuation);
    
    // 全体の70%以上の位置にある句読点を有効とする
    if (lastIndex > maxLength * 0.7 && lastIndex > bestCutPoint) {
      bestCutPoint = lastIndex;
      bestPunctuationIndex = i;
    }
  }

  // 適切な区切り点が見つかった場合
  if (bestCutPoint > -1) {
    // 。！？の場合は句読点含める、、の場合は含めない
    if (bestPunctuationIndex < 3) { // 。！？
      return summary.substring(0, bestCutPoint + 1);
    } else { // 、
      return summary.substring(0, bestCutPoint + 1) + suffix;
    }
  }

  // 適切な区切り点が見つからない場合は suffix を付ける
  return summary + suffix;
}

/**
 * コンテンツの種類に応じて適切な要約長を決定
 */
export function getOptimalSummaryLength(contentLength: number): number {
  if (contentLength < 300) return 80;
  if (contentLength < 800) return 120;
  if (contentLength < 2000) return 150;
  return 200;
}

/**
 * 複数段落から最も情報密度の高い部分を抽出
 */
export function extractBestParagraph(
  content: string, 
  maxLength: number = 120
): string {
  // まずは基本的な清掃
  const cleanContent = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]*>/g, '');

  // 段落に分割
  const paragraphs = cleanContent
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, '').replace(/　/g, ''))
    .filter(p => p.length > 20) // 短すぎる段落は除外
    .slice(0, 3); // 最初の3段落まで

  if (paragraphs.length === 0) {
    return generateAutoSummary(content, maxLength);
  }

  // 最も適切な段落を選択（長さと位置を考慮）
  let bestParagraph = paragraphs[0]; // デフォルトは最初の段落
  
  for (const paragraph of paragraphs) {
    // 適度な長さ（maxLengthの0.8〜1.5倍）の段落を優先
    if (paragraph.length >= maxLength * 0.8 && 
        paragraph.length <= maxLength * 1.5) {
      bestParagraph = paragraph;
      break;
    }
  }

  return generateAutoSummary(bestParagraph, maxLength);
}

/**
 * Astroページで使いやすいヘルパー関数
 */
export function createSmartSummary(
  post: any, 
  options: {
    maxLength?: number;
    preferManual?: boolean;
    suffix?: string;
  } = {}
): string {
  const { 
    maxLength = 120, 
    preferManual = true, 
    suffix = '…' 
  } = options;

  // 1. 手動要約がある場合はそれを優先
  if (preferManual) {
    if (post.data?.summary) return post.data.summary;
    if (post.data?.excerpt) return post.data.excerpt;
    if (post.data?.description) return post.data.description;
  }

  // 2. コンテンツ長に応じて最適な要約長を決定
  const optimalLength = getOptimalSummaryLength(post.body?.length || 0);
  const targetLength = Math.min(maxLength, optimalLength);

  // 3. 最良の段落を抽出して要約生成
  return extractBestParagraph(post.body || '', targetLength);
}

// TypeScript型定義
export interface SummaryOptions {
  maxLength?: number;
  suffix?: string;
  preferManual?: boolean;
}

export interface PostWithBody {
  data?: {
    summary?: string;
    excerpt?: string;
    description?: string;
  };
  body?: string;
}