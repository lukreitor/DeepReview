import { useEffect, useState } from 'react';

export const useFeatureFlag = (flagKey: string, defaultValue = false) => {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    // TODO: integrate with GrowthBook SDK when available
    setEnabled(defaultValue);
  }, [flagKey, defaultValue]);

  return enabled;
};
