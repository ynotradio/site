import { createAdminView } from '../../utils/createAdminView';
import { LiveMatchClient } from './LiveMatchClient';

export const LiveMatchTool = createAdminView(LiveMatchClient);

export default LiveMatchTool;
