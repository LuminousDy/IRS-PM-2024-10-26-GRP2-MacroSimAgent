import argparse
import pickle
import json
import csv
import os

def convert_pkl_to_json(pkl_path, json_path):
    """
    Convert a pickle file to a JSON file.
    """
    with open(pkl_path, 'rb') as f:
        data = pickle.load(f)
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=4)

def convert_json_to_csv(json_path, output_dir):
    """
    Convert JSON data to three CSV files: world.csv, states.csv, PeriodicTax.csv
    """
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Convert 'world' to CSV
    world_data = data.get('world', [])
    world_csv_path = os.path.join(output_dir, 'world.csv')
    with open(world_csv_path, 'w', newline='') as csvfile:
        fieldnames = ['Month', 'Price', '#Products', 'Interest Rate', 'Unemployment Rate', 'Real GDP', 'Nominal GDP', 'Price Inflation', 'Unemployment Rate Growth', 'Wage Inflation', 'Nominal GDP Growth', 'Real GDP Growth']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for i, month_data in enumerate(world_data, start=1):
            row = {
                'Month': i - 1,
                'Price': month_data.get('Price', ''),
                '#Products': month_data.get('#Products', '')
            }
            if (i - 1) % 12 == 0:
                row['Interest Rate'] = month_data.get('Interest Rate', '')
                row['Unemployment Rate'] = month_data.get('Unemployment Rate', '')
                row['Real GDP'] = month_data.get('Real GDP', '')
                row['Nominal GDP'] = month_data.get('Nominal GDP', '')
                row['Price Inflation'] = month_data.get('Price Inflation', '')
                row['Unemployment Rate Growth'] = month_data.get('Unemployment Rate Growth', '')
                row['Wage Inflation'] = month_data.get('Wage Inflation', '')
                row['Nominal GDP Growth'] = month_data.get('Nominal GDP Growth', '')
                row['Real GDP Growth'] = month_data.get('Real GDP Growth', '')
            writer.writerow(row)
    
    # Convert 'states' to CSV
    states_data = data.get('states', [])
    states_csv_path = os.path.join(output_dir, 'states.csv')
    with open(states_csv_path, 'w', newline='') as csvfile:
        fieldnames = ['Agent_ID', 'Month', 'Inventory_Coin', 'Inventory_Products', 'Consumption_Coin', 'Consumption_Products', 'Income_Coin', 'Income_Products', 'Endogenous']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        # Group rows by Agent_ID
        agent_rows = {}
        for month_idx, agents in enumerate(states_data):
            for agent_id, state in agents.items():
                if agent_id == 'p':
                    continue  # Skip 'p' entry if exists
                row = {
                    'Agent_ID': agent_id,
                    'Month': month_idx,
                    'Inventory_Coin': state.get('inventory', {}).get('Coin', ''),
                    'Inventory_Products': state.get('inventory', {}).get('Products', ''),
                    'Consumption_Coin': state.get('consumption', {}).get('Coin', ''),
                    'Consumption_Products': state.get('consumption', {}).get('Products', ''),
                    'Income_Coin': state.get('income', {}).get('Coin', ''),
                    'Income_Products': state.get('income', {}).get('Products', ''),
                    'Endogenous': json.dumps(state.get('endogenous', {}))
                }
                if agent_id not in agent_rows:
                    agent_rows[agent_id] = []
                agent_rows[agent_id].append(row)
        # Write rows grouped by Agent_ID in numerical order
        for agent_id in sorted(agent_rows, key=lambda x: int(x)):
            for row in agent_rows[agent_id]:
                writer.writerow(row)
    
    # Convert 'PeriodicTax' to CSV
    periodic_tax_data = data.get('PeriodicTax', [])
    periodic_tax_csv_path = os.path.join(output_dir, 'PeriodicTax.csv')
    with open(periodic_tax_csv_path, 'w', newline='') as csvfile:
        # Check if periodic_tax_data is a list and has at least one entry
        if isinstance(periodic_tax_data, list) and len(periodic_tax_data) > 0:
            # Extract agent IDs from the first tax record
            tax_record = periodic_tax_data[0]
            agent_ids = [agent_id for agent_id in tax_record.keys() if agent_id not in ['schedule', 'cutoffs', 'p']]
            fieldnames = ['Month', 'Schedule', 'Cutoffs'] + [f'Agent_{agent_id}' for agent_id in agent_ids]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for month_idx, tax_record in enumerate(periodic_tax_data, start=1):
                row = {
                    'Month': month_idx,
                    'Schedule': tax_record.get('schedule', []),
                    'Cutoffs': tax_record.get('cutoffs', []),
                }
                for agent_id in agent_ids:
                    agent_data = tax_record.get(agent_id, {})
                    feature_dict = {
                        'income': agent_data.get('income', ''),
                        'tax_paid': agent_data.get('tax_paid', ''),
                        'marginal_rate': agent_data.get('marginal_rate', ''),
                        'effective_rate': agent_data.get('effective_rate', ''),
                        'lump_sum': agent_data.get('lump_sum', ''),
                    }
                    row[f'Agent_{agent_id}'] = json.dumps(feature_dict)
                writer.writerow(row)
        else:
            # Handle case where 'PeriodicTax' is empty or not a list
            fieldnames = ['Month', 'Schedule', 'Cutoffs']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

def main():
    parser = argparse.ArgumentParser(description='Convert dense_log.pkl to readable_data.csv')
    parser.add_argument('--policy_model', type=str, required=True, help='Policy model name')
    parser.add_argument('--num_agents', type=int, required=True, help='Number of agents')
    parser.add_argument('--episode_length', type=int, required=True, help='Episode length in months')
    parser.add_argument('--city', type=str, required=True, help='City name')
    parser.add_argument('--year', type=int, required=True, help='Year')
    
    args = parser.parse_args()
    
    policy_model = args.policy_model
    num_agents = args.num_agents
    episode_length = args.episode_length
    city = args.city
    year = args.year
    pkl_dir = f'./data/{policy_model}-3-noperception-reflection-1-{num_agents}agents-{episode_length}months'
    pkl_path = os.path.join(pkl_dir, 'dense_log.pkl')
    json_path = os.path.join(pkl_dir, 'dense_log_readable.json')
    output_dir = pkl_dir
    
    if not os.path.exists(pkl_path):
        print(f'Error: {pkl_path} does not exist.')
        return
    
    # Convert pkl to json
    convert_pkl_to_json(pkl_path, json_path)
    print(f'Converted {pkl_path} to {json_path}')
    
    # Convert json to csv
    convert_json_to_csv(json_path, output_dir)
    print(f'Converted {json_path} to CSV files in {output_dir}')

if __name__ == "__main__":
    main()
