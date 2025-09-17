from langchain_community.llms import Ollama

def ask_question(question, transcript, detections):
    # Combine all context into a single prompt
    context = f"""
    VIDEO TRANSCRIPT:
    {transcript}
    
    OBJECT DETECTIONS:
    {detections}
    """
    
    llm = Ollama(
        model="mistral",
        temperature=0.3,
        num_ctx=2048,
        num_thread=4,
        repeat_penalty=1.1
    )
    
    prompt = f"""
    Based on this video context:
    {context}
    
    Answer this question:
    {question}
    """
    
    try:
        response = llm.invoke(prompt)
        return response
    except Exception as e:
        return f"Error generating response: {str(e)}"