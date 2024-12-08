import { hc } from "hono/client";
import type { WebSocketApp } from "../../server/src/websocketServer";
import { useEffect } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    const client = hc<WebSocketApp>("http://localhost:3000/");

    console.log(client.auth.github.$url());
    // const res = client.users.$post({ json: { email: "epic@gmail.com" } });
    // const data = res.then(data => data.json());

    const ws = client.ws.$ws(0);

    ws.addEventListener("open", () => {
      console.log("open!");
    });
  }, []);

  return (
    <section>
      <p>yo</p>
      <div>
        <a href="http://localhost:3000/auth/github">login with google</a>
      </div>
    </section>
  );
}

export default App;
