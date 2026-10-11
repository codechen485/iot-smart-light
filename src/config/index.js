// 从 .env 环境变量读取；未配置时回退默认值，保证不配 .env 也能运行
// VITE_USE_MOCK 为字符串，需显式与 'true' 比较
export const IS_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'
export const MOCK_DELAY = Number(import.meta.env.VITE_MOCK_DELAY) || 500
