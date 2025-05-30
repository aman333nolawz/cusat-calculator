// enpoins:
//      https://cusatapiobj.kerala.gov.in/api/login,
//      https://cusatapiobj.kerala.gov.in/api/questionslist

const base_url = "https://cusatapiobj.kerala.gov.in/api";
const loaderContainer = document.querySelector(".loaderContainer");
const loaderText = document.getElementById("loaderText");
const resultsDiv = document.getElementById("results");

async function login(register_no) {
  console.log("Logging in...");
  loaderContainer.style.display = "block";
  loaderText.textContent = "Logging in...";

  const url = base_url + "/login";
  const data = { register_no: register_no };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw Error("404 returned");
    const jsonResponse = await response.json();
    console.log("Logged in!");
    return jsonResponse;
  } catch (error) {
    console.error("Login failed:", error);
    resultsDiv.innerHTML =
      "naahh.. incorrect Register number! dont confuse with Roll Number .";
    resultsDiv.classList.add("error");
    loaderContainer.style.display = "none";
    loaderText.textContent = "";

    throw error; // rethrow
  }
}

async function get_questionlist(auth_token, exam_id) {
  console.log("Getting question list...");
  loaderContainer.style.display = "block";
  loaderText.textContent = "Getting question list...";

  const url = base_url + "/questionslist";
  const headers = {
    Authorization: "Bearer " + auth_token,
    "Content-Type": "application/json",
  };
  const data = { examId: exam_id };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw Error("exam code invalid");
    const jsonResponse = await response.json();
    console.log("Got questions!");
    loaderContainer.style.display = "none";
    loaderText.textContent = "";

    return jsonResponse;
  } catch (error) {
    console.error("Failed to get questions:", error);
    loaderContainer.style.display = "none";
    loaderText.textContent = "";
    throw error; // rethrows
  }
}

async function main() {
  resultsDiv.innerHTML = "";
  resultsDiv.className = "";
  try {
    const register_no = document.getElementById("register_no").value.trim();
    const loginResponse = await login(register_no);
    const auth_token = loginResponse["access_token"];
    const exams = loginResponse["exams"]; // Get all exams
    const candidate_name =
      loginResponse["candidates"]["vchrCandidateName"] || "N/A";

    let allResults = `<strong>Name</strong>: ${candidate_name}<br /><br />`;

    for (let i = 0; i < exams.length; i++) {
      const exam = exams[i];
      const exam_id = exam["intExamID"];
      const exam_name = exam["vchrExamName"] || `Exam ${i + 1}`;

      try {
        const questionlist = await get_questionlist(auth_token, exam_id);

        let score = 0;
        let total_qs = 0;
        let attempted_qs = 0;
        let correct_qs = 0;
        let incorrect_qs = 0;
        let cancelled_qs = 0;

        for (const question of questionlist["questions"]) {
          const correct_answer = question["correctAnswer"];
          const selected_answer = question["selectedAnswer"];
          const cancellation_status = question["intCancellationStatus"];

          if (
            cancellation_status === 1 ||
            typeof correct_answer !== "string" ||
            !/^\d+$/.test(correct_answer.trim())
          ) {
            cancelled_qs += 1;
            continue;
          }

          if (selected_answer === null) {
            total_qs += 1;
            continue;
          }

          if (parseInt(correct_answer) === parseInt(selected_answer)) {
            score += 3;
            correct_qs += 1;
          } else {
            score -= 1;
            incorrect_qs += 1;
          }

          attempted_qs += 1;
          total_qs += 1;
        }

        allResults += `<div class="result">`;
        allResults += `<strong style="text-decoration: underline; font-size: 1.2em;">${exam_name}</strong><br />`;
        allResults += `<strong>Final Score</strong>: ${score}<br />`;
        allResults += `<strong>Attempted</strong>: ${attempted_qs}<br />`;
        allResults += `<strong>Correct</strong>: ${correct_qs}<br />`;
        allResults += `<strong>Incorrect</strong>: ${incorrect_qs}<br />`;
        allResults += `<strong>Cancelled</strong>: ${cancelled_qs}<br />`;
        allResults += `<strong>Total Questions</strong>: ${total_qs}<br />`;
        allResults += `</div>`;
      } catch (examError) {
        console.error(`Error processing exam ${exam_id}:`, examError);
        allResults += `<div class="result error">`;
        allResults += `<strong>❌ ${exam_name}</strong><br />`;
        allResults += `Error loading exam data<br />`;
        allResults += `</div>`;
      }
    }

    resultsDiv.innerHTML = allResults;
  } catch (error) {

    console.error("Error occurred:", error);
    
  }
}
document.getElementById("calculate").addEventListener("click", main);
