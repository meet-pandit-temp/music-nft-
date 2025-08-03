// --- src/hooks/useAlchemy.js ---
import { Network, Alchemy } from 'alchemy-sdk';
import { useEffect, useState } from 'react';

export const useAlchemy = () => {
  const [alchemy, setAlchemy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    const alchemyNetwork = Network.OPT_SEPOLIA;
    
    if (!alchemyApiKey) {
      setError("Alchemy API Key (VITE_ALCHEMY_API_KEY) missing. Check .env.");
      return;
    }
    
    const settings = { apiKey: alchemyApiKey, network: alchemyNetwork };
    
    try {
      const alchemyInstance = new Alchemy(settings);
      console.log(`Alchemy SDK initialized for ${alchemyNetwork.toString()}.`);
      setAlchemy(alchemyInstance);
    } catch (e) {
      console.error("Failed to initialize Alchemy SDK.", e);
      setError(`Failed to initialize Alchemy SDK: ${e.message}`);
    }
  }, []);

  return { alchemy, error, network: Network.OPT_SEPOLIA };
};