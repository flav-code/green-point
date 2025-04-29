const fs = require('node:fs');

(async () => {
    const systempromt = fs.readFileSync("systemprompt.txt", "utf8")


    userpromt = "hello, how are you doing today?"

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "deepseek-r1",
        prompt: `${systempromt}, according to these guidelines respond to this message: ${userpromt}`,
        stream: false,
        options: {
            seed: 42,
            num_predict: 8192,
            top_k: 20,
            top_p: 0.9,
            min_p: 0.0,
            typical_p: 0.7,
            repeat_last_n: 33,
            temperature: 0.8,
            repeat_penalty: 1.2,
            presence_penalty: 1.5,
            frequency_penalty: 1.0,
            mirostat: 1,
            mirostat_tau: 0.8,
            mirostat_eta: 0.6,
            penalize_newline: true,
            num_ctx: 1024,
            low_vram: true,
        }
    })

    })

    jsonrep = await response.json()
    console.log(jsonrep)
    textrep = jsonrep.response
    donereson = jsonrep.done_reason
    if (donereson == "lenght") {
        console.log("response was cut off")
        return;
    }
    console.log(textrep.split("</think>\n\n")[1])
}) ()
