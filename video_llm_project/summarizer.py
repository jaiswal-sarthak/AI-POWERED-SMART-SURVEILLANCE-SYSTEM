from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(transcript):
    chunks = [transcript[i:i+1000] for i in range(0, len(transcript), 1000)]
    summary = ""
    for chunk in chunks:
        summary += summarizer(chunk, max_length=100, min_length=30, do_sample=False)[0]['summary_text'] + " "
    return summary
