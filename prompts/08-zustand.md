Read AGENTS.md first and follow it strictly.

Integrate language selection state. Store the selected language using Zustand with the modern `@react-native-async-storage/async-storage` package. Implement a single redirect precedence: wait for authentication state and Zustand/AsyncStorage hydration, send unauthenticated users to /onboarding, authenticated users without a selected language to /language-selection, and authenticated users with a language to /. Update the authentication/navigation guard and language state symbols accordingly, preserving the existing UI.

ADD a button on home screen route to clear async storage for testing language selection state.
