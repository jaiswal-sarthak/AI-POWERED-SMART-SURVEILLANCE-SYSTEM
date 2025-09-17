from llama_cpp import Llama

llm = Llama(
    model_path="models/mistral-7b-instruct.gguf",
    n_ctx=2048,
    n_threads=6
)

def ask_llm(prompt):
    output = llm(prompt, max_tokens=300)
    return output['choices'][0]['text']
