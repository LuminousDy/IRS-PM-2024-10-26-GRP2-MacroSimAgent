import numpy as np
from scipy.spatial.distance import cosine
import random

def read_clusters(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        clusters = [eval(line.strip().replace('Chief Executive Officer', 'CEO')) for line in f]
    return clusters

def read_embeddings(file_path):
    embeddings = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        next(f)  # Skip header if present
        for line in f:
            parts = line.strip().split(',')
            occupation = parts[0].replace('Chief Executive Officer', 'CEO')
            vector = np.array([float(x) for x in parts[1:]])
            embeddings[occupation] = vector
    return embeddings

def find_cluster(occupation, clusters):
    for i, cluster in enumerate(clusters):
        if occupation in cluster:
            return i
    return -1

def calculate_similarities(occupation, cluster, embeddings):
    similarities = {}
    for other in cluster:
        if other in embeddings and occupation in embeddings:
            sim = 1 - cosine(embeddings[occupation], embeddings[other])
            similarities[other] = sim
    return similarities

def normalize_to_probabilities(similarities):
    total = sum(similarities.values())
    if total == 0:
        return {k: 1/len(similarities) for k in similarities}
    return {k: v / total for k, v in similarities.items()}

def next_likely_occupation(previous_job, clusters, embeddings):
    if previous_job == 'Unemployment':
        all_jobs = [job for cluster in clusters for job in cluster]
        next_occupation = random.choice(all_jobs)
        return next_occupation, {}
    
    occupation = previous_job.replace('Chief Executive Officer', 'CEO')
    cluster_index = find_cluster(occupation, clusters)
    if cluster_index == -1:
        return "Occupation not found in clusters", {}
    
    cluster = clusters[cluster_index]
    similarities = calculate_similarities(occupation, cluster, embeddings)
    if not similarities:
        return "No similarities found", {}
    probabilities = normalize_to_probabilities(similarities)
    
    next_occupation = random.choices(
        list(probabilities.keys()),
        weights=list(probabilities.values()),
        k=1
    )[0]
    return next_occupation, probabilities

def main(previous_job, year=2018):
    # Load clusters and embeddings based on the year
    clusters_file = f'data/clustered_profiles_us_{year}.txt'
    embeddings_file = f'data/node_embeddings_us_{year}.csv'
    
    clusters = read_clusters(clusters_file)
    embeddings = read_embeddings(embeddings_file)
    
    next_occupation, probabilities = next_likely_occupation(previous_job, clusters, embeddings)
    
    return next_occupation
