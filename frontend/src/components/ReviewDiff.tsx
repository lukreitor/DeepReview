import DiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

export type ReviewDiffProps = {
  original: string;
  improved?: string | null;
  language?: string;
};

export const ReviewDiff = ({ original, improved, language }: ReviewDiffProps) => {
  if (!improved) {
    return null;
  }

  return (
    <DiffViewer
      oldValue={original}
      newValue={improved}
      splitView={true}
      hideLineNumbers={false}
      compareMethod={DiffMethod.WORDS}
      styles={{
        variables: {
          light: {
            diffViewerBackground: 'var(--chakra-colors-gray-50)',
            addedGutterBackground: 'var(--chakra-colors-green-50)',
            removedGutterBackground: 'var(--chakra-colors-red-50)',
          },
          dark: {
            diffViewerBackground: 'var(--chakra-colors-gray-800)',
            addedGutterBackground: 'var(--chakra-colors-green-900)',
            removedGutterBackground: 'var(--chakra-colors-red-900)',
          },
        },
      }}
      leftTitle={`Current (${language ?? 'unknown'})`}
      rightTitle="AI Suggestion"
    />
  );
};
