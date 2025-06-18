import { Route, Switch } from "wouter"
import LandingPage from "./pages/index"

function App() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route>404 - Página não encontrada</Route>
    </Switch>
  )
}

export default App