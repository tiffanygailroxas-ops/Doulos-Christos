
import { BibleVerse } from './types';

export const BIBLE_VERSES: BibleVerse[] = [
  { reference: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { reference: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { reference: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all thine heart; and lean not unto thine own wisdom. In all thy ways acknowledge him, and he shall direct thy paths." },
  { reference: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
  { reference: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
  { reference: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." },
  { reference: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end." },
  { reference: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen." }
];

// Using the direct download link format for Google Drive images
export const LOGO_URL = "https://drive.google.com/uc?export=view&id=1rjIEoMBT7v4IxAiltghTdyfm8RJ3tMKT"; 

export const WALLET_ADDRESS = "0x39a33aad3369cca7261bff959b6b18473c638016";
export const CLAIM_REWARD = 1;
export const MAX_INVITES = 25;
export const INVITE_REWARD = 10;

// Requirement: 30 days straight = 30 $DSCS extra reward
export const STREAK_REWARDS = {
  30: 30
};
