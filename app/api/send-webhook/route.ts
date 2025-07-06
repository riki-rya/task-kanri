import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const inquiryData = await request.json();
    
    // 必須フィールドのバリデーション
    if (!inquiryData.subject || !inquiryData.message) {
      return NextResponse.json({ 
        error: 'Missing required fields: subject and message are required' 
      }, { status: 400 });
    }

    // Discord Webhook URL（環境変数から取得）
    const discordWebhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    
    if (!discordWebhookUrl) {
      console.warn('Discord Webhook URL not configured');
      return NextResponse.json({ 
        error: 'Discord Webhook URL not configured' 
      }, { status: 500 });
    }

    // Discord用のペイロードを作成
    const discordPayload = {
      content: "📧 新しいお問い合わせが届きました",
      embeds: [
        {
          title: "お問い合わせ詳細",
          color: 0x5865F2, // Discordのブルー色
          fields: [
            {
              name: "カテゴリ",
              value: getCategoryLabel(inquiryData.category),
              inline: true
            },
            {
              name: "件名",
              value: inquiryData.subject,
              inline: true
            },
            {
              name: "お名前",
              value: inquiryData.user_name || "未入力",
              inline: true
            },
            {
              name: "メールアドレス",
              value: inquiryData.user_email,
              inline: true
            },
            {
              name: "送信日時",
              value: new Date(inquiryData.submitted_at).toLocaleString('ja-JP'),
              inline: true
            },
            {
              name: "ユーザーID",
              value: inquiryData.user_id || "ゲストユーザー",
              inline: true
            },
            {
              name: "お問い合わせ内容",
              value: inquiryData.message.length > 1000 
                ? inquiryData.message.substring(0, 1000) + "..." 
                : inquiryData.message,
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "お問い合わせシステム"
          }
        }
      ]
    };

    console.log('Sending Discord webhook payload:', discordPayload);

    // Discord webhookに送信
    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
      // タイムアウトを10秒に設定
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord webhook failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return NextResponse.json({ 
        error: `Discord webhook failed with status ${response.status}: ${errorText}` 
      }, { status: 500 });
    }

    console.log('Discord webhook sent successfully');

    return NextResponse.json({ 
      message: 'Discord webhook sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Discord webhook error:', error);
    
    // エラーの詳細を判別
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Discord webhook request timed out';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error occurred';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// カテゴリラベルを取得する関数
function getCategoryLabel(category: string): string {
  const categories: { [key: string]: string } = {
    'general': '一般的なお問い合わせ',
    'technical': '技術的な問題',
    'feature': '機能の要望',
    'billing': '料金について',
    'other': 'その他'
  };
  return categories[category] || category;
}