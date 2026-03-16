'use client';

import React, { useState } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { DailyContentTab } from './DailyContentTab';
import { MRMTab } from './MRMTab';
import './EditorGuideClient.css';

type Tab = 'daily' | 'mrm';

export const EditorGuideClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const { setStepNav } = useStepNav();

  React.useEffect(() => {
    setStepNav([{ label: 'Editor Guide' }]);
  }, [setStepNav]);

  return (
    <Gutter>
      <div className="editor-guide">
        <div className="editor-guide__header">
          <h1 className="editor-guide__title">📖 Editor Guide</h1>
          <p className="editor-guide__subtitle">
            Quick reference for managing Y-Not Radio content in Payload. Click any link to jump
            directly to a collection.
          </p>
        </div>

        <div className="editor-guide__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'daily'}
            className={`editor-guide__tab${activeTab === 'daily' ? ' editor-guide__tab--active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            📋 Daily Content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mrm'}
            className={`editor-guide__tab${activeTab === 'mrm' ? ' editor-guide__tab--active' : ''}`}
            onClick={() => setActiveTab('mrm')}
          >
            🎸 Modern Rock Madness
          </button>
        </div>

        {activeTab === 'daily' && <DailyContentTab />}
        {activeTab === 'mrm' && <MRMTab />}
      </div>
    </Gutter>
  );
};

export default EditorGuideClient;
