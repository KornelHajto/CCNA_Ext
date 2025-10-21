import requests
from bs4 import BeautifulSoup
import csv
from urllib.parse import urljoin


def scrape_it_exam_answers(url):
    """
    Scrapes numbered questions (using <b> or <strong>) and their answers from the URL.

    Args:
        url: The URL of the page to scrape.

    Returns:
        A list of dictionaries for each numbered question found.
    """
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        content = soup.find('div', class_='thecontent')
        if not content:
            print("Could not find the main content area.")
            return []

        qa_pairs = []

        potential_questions = content.find_all('p')

        for tag in potential_questions:
            # **CHANGE:** Check if the tag contains <strong> OR <b>
            if tag.find('strong') or tag.find('b'):
                question_text = tag.get_text(strip=True)

                # Check if the question starts with a number (e.g., "1.", "165.")
                if '.' in question_text and question_text.split('.')[0].isdigit():
                    answer_text = "no answer found"

                    # Case 1: Answer is in a <ul> list
                    answer_list = tag.find_next_sibling('ul')
                    if answer_list:
                        correct_answer_tag = answer_list.find('span', style=lambda v: v and 'color' in v and (
                                    'red' in v or '#ff0000' in v))
                        if correct_answer_tag:
                            answer_text = correct_answer_tag.find_parent('li').get_text(strip=True)

                    # Case 2: Answer is an image
                    else:
                        next_element = tag.find_next_sibling()
                        if next_element and next_element.find('img'):
                            image_tag = next_element.find('img')
                            image_url = urljoin(url, image_tag['src'])
                            answer_text = f"IMAGE ANSWER: {image_url}"

                    qa_pairs.append({'question': question_text, 'answer': answer_text})

        return qa_pairs

    except requests.exceptions.RequestException as e:
        print(f"Error fetching the URL: {e}")
        return None


def save_to_csv(data, filename="scraped_numbered_questions_final.csv"):
    """Saves the scraped data to a CSV file."""
    if not data:
        print("No data to save.")
        return

    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['question', 'answer']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"Data successfully saved to {filename}")


if __name__ == "__main__":
    exam_url = "https://itexamanswers.net/ccna-2-v7-0-final-exam-answers-full-switching-routing-and-wireless-essentials.html"
    scraped_data = scrape_it_exam_answers(exam_url)

    if scraped_data:
        # Print the results
        for i, qa in enumerate(scraped_data, 1):
            print(f"## Question {i}:")
            print(f"**Q:** {qa['question']}")
            print(f"**A:** {qa['answer']}\n")

        # Save the results to a new CSV file
        save_to_csv(scraped_data)