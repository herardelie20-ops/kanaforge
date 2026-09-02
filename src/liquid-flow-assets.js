export const liquidFlowAssets=Object.entries(import.meta.glob('./assets/liquid-flow-*.png',{eager:true,import:'default'})).sort(([left],[right])=>left.localeCompare(right)).map(([,url])=>url);
