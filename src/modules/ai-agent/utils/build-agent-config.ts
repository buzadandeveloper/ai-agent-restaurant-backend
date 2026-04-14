import { KnowledgeBaseData } from '../types/knowledge-base-data.types';
import { tools } from './tools';
import { getInstructions } from './get-instructions';

export const buildAgentConfig = (knowledgeBase: KnowledgeBaseData, model: string, voice: string) => {
  return {
    model,
    voice,
    instructions: getInstructions(knowledgeBase),
    tools,
  };
};

//'gpt-4o-realtime-preview-2024-12-17'
//'verse'
