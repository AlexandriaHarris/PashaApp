# ENT Training App

A comprehensive Otolaryngology training application built with React Native/Expo, incorporating evidence-based learning techniques from "Make it Stick" by Peter C. Brown.

## Learning Science Features

This app implements the key principles from cognitive science research:

### 1. **Spaced Repetition** (SM-2 Algorithm)
- Questions are scheduled for review at optimal intervals
- Correctly answered questions appear less frequently
- Difficult questions reappear sooner for reinforcement

### 2. **Interleaving**
- Mixed Practice mode shuffles questions from different categories
- Prevents the illusion of competence from blocked practice
- Improves long-term retention and transfer

### 3. **Retrieval Practice**
- Every question is a test, not just a review
- Immediate feedback with detailed explanations
- References to authoritative sources

### 4. **Desirable Difficulty**
- Weak Areas mode focuses on challenging content
- Timed tests add productive pressure
- Difficulty ratings help personalize the experience

### 5. **Elaboration**
- Key learning points connect concepts
- Detailed explanations provide context
- References encourage deeper study

## Project Structure

```
ENTPracticeApp/
├── App.js                          # Main app component
├── package.json                    # Dependencies
├── app.json                        # Expo configuration
└── src/
    └── data/
        ├── spacedRepetition.js     # SM-2 algorithm implementation
        ├── interleaving.js         # Category mixing algorithms
        └── questions/
            └── facialPlastics.js   # Facial Plastics questions (50)
```

## Practice Modes

| Mode | Description | Learning Principle |
|------|-------------|-------------------|
| **Spaced Review** | Due cards + new cards | Spacing Effect |
| **Mixed Practice** | Interleaved categories | Interleaving |
| **Weak Areas** | Low-accuracy topics | Desirable Difficulty |
| **By Category** | Focused topic practice | Focused Learning |
| **Timed Test** | 25 questions, 37.5 min | Testing Effect |

## Getting Started

### Prerequisites
- Node.js (v14 or newer)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Expo Go app on your iPhone

### Installation

```bash
cd ENTPracticeApp
npm install
cp .env.example .env
```

### Running the App

```bash
# Start the development server
npx expo start

# For iOS
npx expo start --ios

# Scan QR code with Expo Go app on your iPhone
```

### Environment Strategy (Dev/Prod)

Firebase config can be supplied through Expo public env vars in `.env`:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

If these values are missing, the app falls back to the current bundled project config.

### Native Build Notes

- iOS native folder exists and can be run with `npm run ios`.
- Android native folder is not committed; if needed, generate it before first native Android run:

```bash
npx expo prebuild --platform android
npm run android
```

## Building for iOS App Store

### 1. Create an Expo Account
```bash
npx expo register  # or login with: npx expo login
```

### 2. Configure EAS Build
```bash
npm install -g eas-cli
eas build:configure
```

### 3. Build for iOS
```bash
eas build --platform ios
```

### 4. Submit to App Store
```bash
eas submit --platform ios
```

**Note:** You need an Apple Developer account ($99/year) to submit to the App Store.

## Adding More Questions

To add questions for other ENT subspecialties, create new files in `src/data/questions/`:

```javascript
// src/data/questions/otology.js
export const otologyQuestions = [
  {
    id: 'ot001',
    category: 'OTOLOGY',
    subcategory: 'Hearing Loss',
    difficulty: 'basic',
    stem: 'Clinical scenario...',
    leadIn: 'What is the most likely diagnosis?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
    explanation: 'Detailed explanation...',
    keyPoint: 'Key takeaway...',
    references: [
      'Cummings Otolaryngology, 7th ed. Chapter X',
      'Journal article citation...'
    ]
  },
  // ... more questions
];

export default otologyQuestions;
```

Then import in `App.js`:

```javascript
import otologyQuestions from './src/data/questions/otology';

const ALL_QUESTIONS = [
  ...facialPlasticsQuestions,
  ...otologyQuestions,  // Add here
];
```

## Question Format (ABO Style)

Each question follows the American Board of Otolaryngology format:

- **stem**: Clinical vignette (patient presentation)
- **leadIn**: The actual question being asked
- **options**: 4 answer choices (A-D)
- **correctIndex**: Index of correct answer (0-3)
- **explanation**: Why the correct answer is right
- **keyPoint**: High-yield takeaway
- **references**: 2-3 authoritative sources

## Category Structure

| Category Key | Name | Subcategories |
|-------------|------|---------------|
| OTOLOGY | Otology | Hearing Loss, Vestibular, Otitis Media, etc. |
| RHINOLOGY | Rhinology | Sinusitis, Nasal Obstruction, Skull Base, etc. |
| LARYNGOLOGY | Laryngology | Voice, Swallowing, Airway, etc. |
| HEAD_NECK | Head & Neck | Thyroid, Salivary, Oral Cavity, etc. |
| FACIAL_PLASTICS | Facial Plastics | Rhinoplasty, Facial Nerve, Trauma, etc. |
| PEDIATRICS | Pediatric ENT | Airway, Congenital, T&A, etc. |
| SLEEP | Sleep Medicine | OSA, CPAP, Surgery, etc. |

## Data Persistence

The app stores:
- **cardData**: Spaced repetition data for each question (ease factor, interval, next review)
- **recentCategories**: For interleaving algorithm
- **sessionHistory**: Past session results

Currently using in-memory storage (reset on app restart). For production, uncomment AsyncStorage code.

## License

For educational purposes only. Medical content should be verified with current references.

## Contributing

To add questions:
1. Follow the ABO question format
2. Include 2-3 current references
3. Cover all difficulty levels (basic, intermediate, advanced)
4. Test for accuracy before submitting

## Deployment Notes

- Canonical Firebase deploy path now copies both `admin/` and `public/consents` into `dist/`.
- Use either:
  - `npm run deploy:firebase`
  - `bash scripts/deploy.sh`

## Admin Dashboard Ops (No Terminal)

Use the `admin` dashboard for Firebase checks and report maintenance:

1. Open `/admin` in your deployed site or open `admin/index.html` locally.
2. Sign in with an admin email.
3. Go to the **Reports** tab and use **Reports Ops**:
   - **Check Connection**: validates Firebase auth + Firestore reads.
   - **Refresh Summary**: scans all reports and shows status/type breakdown.
   - **Repair Dry Run**: previews report fixes without writing data.
   - **Apply Repairs**: commits repair updates in Firestore batches.
4. Use **Export CSV** or **Export JSON** to download all reports.
