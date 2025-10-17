import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './config';

// ⚠️ SECURITY: API keys should NEVER be hardcoded in client code
// API keys must be configured server-side or through an admin interface
// This file now only manages retrieval from Firebase

// Initialize API keys in Firebase (admin-only function)
// Call this ONLY from a secure backend or admin dashboard
export const initializeApiKeys = async (apiKeys: string[]): Promise<void> => {
  try {
    if (!apiKeys || apiKeys.length === 0) {
      console.warn('⚠️ No API keys provided for initialization');
      return;
    }
    
    console.log('Initializing API keys in Firebase...');
    
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKeyDoc = {
        keyId: `key_${i + 1}`,
        // Store a hashed/masked version for display only
        keyPreview: `${apiKeys[i].substring(0, 10)}...${apiKeys[i].substring(apiKeys[i].length - 4)}`,
        index: i + 1,
        isActive: true,
        usageCount: 0,
        lastUsed: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'admin/apiKeys/keys', `key_${i + 1}`), apiKeyDoc);
      console.log(`API Key ${i + 1} stored securely in Firebase`);
    }
    
    console.log('✅ All API keys initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing API keys:', error);
    throw error;
  }
};

// Get all available API key metadata from Firebase (without exposing actual keys)
export const getAvailableApiKeyMetadata = async (): Promise<any[]> => {
  try {
    const apiKeysRef = collection(db, 'admin/apiKeys/keys');
    const q = query(apiKeysRef, orderBy('index'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const apiKeyMetadata: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isActive) {
        apiKeyMetadata.push({
          id: doc.id,
          keyPreview: data.keyPreview,
          isActive: data.isActive,
          usageCount: data.usageCount,
          lastUsed: data.lastUsed
        });
      }
    });
    
    return apiKeyMetadata;
  } catch (error) {
    console.error('❌ Error getting API key metadata from Firebase:', error);
    return [];
  }
};

// Assign a random API key from Firebase (server-side function - DO NOT expose keys to client)
// This should be called from a Cloud Function or backend
export const assignRandomApiKey = async (): Promise<string> => {
  try {
    // Get metadata of available keys
    const keyMetadata = await getAvailableApiKeyMetadata();
    
    if (keyMetadata.length === 0) {
      throw new Error('No API keys available in Firebase');
    }
    
    // Randomly select an API key ID
    const randomIndex = Math.floor(Math.random() * keyMetadata.length);
    const selectedKeyId = keyMetadata[randomIndex].id;
    
    console.log(`✅ Assigned API key: ${keyMetadata[randomIndex].keyPreview}`);
    
    // Return the key ID only (actual key should be retrieved server-side)
    return selectedKeyId;
  } catch (error) {
    console.error('❌ Error assigning API key:', error);
    return '';
  }
};

// Check if API keys are initialized in Firebase
export const checkApiKeysInitialized = async (): Promise<boolean> => {
  try {
    const apiKeysRef = collection(db, 'admin/apiKeys/keys');
    const querySnapshot = await getDocs(apiKeysRef);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('❌ Error checking API keys:', error);
    return false;
  }
};

// Display all API key metadata in Firebase (for debugging - never shows actual keys)
export const displayAllApiKeys = async (): Promise<void> => {
  try {
    const apiKeysRef = collection(db, 'admin/apiKeys/keys');
    const querySnapshot = await getDocs(apiKeysRef);
    
    console.log('🔑 API Keys in Firebase (Metadata Only):');
    console.log('========================================');
    
    if (querySnapshot.empty) {
      console.log('❌ No API keys found in Firebase');
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📋 ${doc.id}:`);
      console.log(`   Preview: ${data.keyPreview}`);
      console.log(`   Index: ${data.index}`);
      console.log(`   Active: ${data.isActive}`);
      console.log(`   Usage Count: ${data.usageCount}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
      console.log('   ---');
    });
    
    console.log(`✅ Total API keys: ${querySnapshot.size}`);
  } catch (error) {
    console.error('❌ Error displaying API keys:', error);
  }
};
