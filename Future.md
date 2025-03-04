# Future Ideas

## Prompt

Your project on analyzing pull requests (PRs) for Ramda organization was a proof-of-concept to better understand PR reporting and look through how organizations operate. The full project has been prioritized.

The Product team wants to add a feature analyzing PR time from open to merge and provide insights to their customers to analyze the most effective attributes that result in quick PR-time using some AI clustering algorithms.

Another team (Team AI) will handle the actual AI component, your team needs to get the data to them. That team is also working on their side of it at the same time.

Team UI is yet another team you’ll interact with. They are working on a dashboard component that makes it possible for various organizations to specify what attributes are important to them to direct the AI ingestion that will ultimately generate reports.

As the lead of this project, you need to get all Pull Request data for all organizations on all of Github. It's also likely that Team AI will want additional data to draw some conclusions about authors of PRs, discussions, and how that may or may not contribute to PR open-time. You also need to make available an API for Team UI that will enable special tuning of that ingestion.

Based on your learnings from the proof-of-concept, think through how you'd architect this project technically, approach delivery, and interact with the other team. We will discuss trade-offs and your thinking of various components and dive into how that could play out.
