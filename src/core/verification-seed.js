// Temporary acceptance aid: remove after user acceptance (item 12).
import catalogue from '../content/apk-shop-catalog.js';
export const isVerificationSeed=seed=>seed==='13031990';
export const verificationCentreIds=catalogue.centres.filter(c=>!c.omit).map(c=>c.key);
