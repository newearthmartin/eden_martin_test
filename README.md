Quick app created with [Create React App](https://github.com/facebook/create-react-app).

## Usage

```
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Deploy

```
npm run build
firebase deploy
```

Then open [https://eden-martin-test.web.app/](https://eden-martin-test.web.app/).

## Config file

For the project to work, you need to add a `firebaseConfig.js` file in the `src` folder with the following contents:

```
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}

export default firebaseConfig
```
