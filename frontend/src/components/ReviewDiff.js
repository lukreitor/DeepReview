import { jsx as _jsx } from "react/jsx-runtime";
import DiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
export const ReviewDiff = ({ original, improved, language }) => {
    if (!improved) {
        return null;
    }
    return (_jsx(DiffViewer, { oldValue: original, newValue: improved, splitView: true, hideLineNumbers: false, compareMethod: DiffMethod.WORDS, styles: {
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
        }, leftTitle: `Current (${language ?? 'unknown'})`, rightTitle: "AI Suggestion" }));
};
