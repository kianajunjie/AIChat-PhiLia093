import { exportChat as apiExport } from '../services/api.js'

export async function exportConversation(messages, format = 'markdown') {
  await apiExport(messages, format)
}

export const EXPORT_FORMATS = [
  { id: 'markdown', label: 'Markdown (.md)', icon: '📝' },
  { id: 'json', label: 'JSON (.json)', icon: '📋' },
  { id: 'txt', label: '纯文本 (.txt)', icon: '📄' },
]
