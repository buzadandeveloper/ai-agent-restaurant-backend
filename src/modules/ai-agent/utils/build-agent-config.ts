import { KnowledgeBaseData } from '../types/knowledge-base-data.types';
import { tools } from './tools';
import { getInstructions } from './get-instructions';

export const buildAgentConfig = (user: KnowledgeBaseData) => {
  return {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'verse',
    instructions: getInstructions(user),
    tools,
  };
};
