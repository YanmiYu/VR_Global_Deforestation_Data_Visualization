import pandas as pd


def cover():

    df = pd.read_excel('/Users/yanmiyu/Desktop/VR/data.xlsx')

    # Define the columns for each 5-year interval
    loss_columns_2000_2005 = [f'tc_loss_ha_{year}' for year in range(2001, 2006)]
    loss_columns_2005_2010 = [f'tc_loss_ha_{year}' for year in range(2005, 2011)]
    loss_columns_2010_2015 = [f'tc_loss_ha_{year}' for year in range(2010, 2016)]
    loss_columns_2015_2020 = [f'tc_loss_ha_{year}' for year in range(2015, 2021)]

    # Group by country and sum the tree cover loss for all thresholds
    grouped_df = df.groupby('country').sum()

    # Calculate total tree cover loss for each 5-year interval
    grouped_df['2000-2005_cover_loss'] = grouped_df[loss_columns_2000_2005].sum(axis=1)
    grouped_df['2005-2010_cover_loss'] = grouped_df[loss_columns_2005_2010].sum(axis=1)
    grouped_df['2010-2015_cover_loss'] = grouped_df[loss_columns_2010_2015].sum(axis=1)
    grouped_df['2015-2020_cover_loss'] = grouped_df[loss_columns_2015_2020].sum(axis=1)

    # Select only the required columns for the final output
    output_columns = ['2000-2005_cover_loss', '2005-2010_cover_loss', '2010-2015_cover_loss', '2015-2020_cover_loss']
    output_df = grouped_df[output_columns].reset_index()

    # Save the transformed data to a new Excel file
    output_df.to_excel('total_tree_cover_loss_by_country.xlsx', index=False)

    # Print the transformed DataFrame
    print(output_df)

def match_name():

    # Load the Excel file
    data_path = "/Users/yanmiyu/Desktop/VR/data.xlsx"
    df_data = pd.read_excel(data_path)

    # Load the CSV file with ISO codes and country names
    iso_metadata_path = "/Users/yanmiyu/Desktop/VR/iso_metadata.csv"
    df_iso = pd.read_csv(iso_metadata_path)

    # Merge the two datasets on the 'iso' column
    df_merged = df_data.merge(df_iso, on='iso', how='left')

    # Save the updated DataFrame to a new Excel file
    output_path = "/Users/yanmiyu/Desktop/VR/data_with_names.xlsx"
    df_merged.to_excel(output_path, index=False)

    print(f"Updated Excel file saved to: {output_path}")

def pre_cover_gain():


    # Load the data into a DataFrame
    data_path = "/Users/yanmiyu/Desktop/VR/cover_gain.xlsx"  # Replace with your file path
    df = pd.read_excel(data_path)

    # Calculate the new columns
    df['2000-2005 umd_tree_cover_gain__ha'] = df['2000-2020 umd_tree_cover_gain__ha'] - df['2005-2020 umd_tree_cover_gain__ha']
    df['2005-2010 umd_tree_cover_gain__ha'] = df['2005-2020 umd_tree_cover_gain__ha'] - df['2010-2020 umd_tree_cover_gain__ha']
    df['2010-2015 umd_tree_cover_gain__ha'] = df['2010-2020 umd_tree_cover_gain__ha'] - df['2015-2020 umd_tree_cover_gain__ha']

    # Rename the existing 2015-2020 column for consistency
    df.rename(columns={'2015-2020 umd_tree_cover_gain__ha': '2015-2020 umd_tree_cover_gain__ha'}, inplace=True)

    # Select the required columns for the final output
    output_columns = [
        'iso', 'name',
        '2000-2005 umd_tree_cover_gain__ha', '2005-2010 umd_tree_cover_gain__ha',
        '2010-2015 umd_tree_cover_gain__ha', '2015-2020 umd_tree_cover_gain__ha'
    ]
    output_df = df[output_columns]

    # Save the revised data to a new Excel file
    output_path = "/Users/yanmiyu/Desktop/VR/revised_tree_cover_gain.xlsx"
    output_df.to_excel(output_path, index=False)

    print(f"Revised Excel file saved to: {output_path}")
def merge():


    # Load the Excel files
    cover_loss_path = "/Users/yanmiyu/Desktop/VR/cover loss.xlsx"
    cover_gain_path = "/Users/yanmiyu/Desktop/VR/cover_gain.xlsx"

    df_loss = pd.read_excel(cover_loss_path)
    df_gain = pd.read_excel(cover_gain_path)

    # Merge the two datasets on the 'name' column
    df_merged = df_loss.merge(df_gain, on='country', how='outer')

    # Save the merged DataFrame to a new Excel file
    output_path = "/Users/yanmiyu/Desktop/VR/merged_cover_data.xlsx"
    df_merged.to_excel(output_path, index=False)

    print(f"Merged Excel file saved to: {output_path}")


def to_json():
    file_path = '/Users/yanmiyu/Desktop/VR/final_data.xlsx'
    df = pd.read_excel(file_path)

    # Convert the DataFrame to JSON
    json_data = df.to_json(orient='records', indent=4)

    # Save the JSON data to a file (optional)
    with open('/Users/yanmiyu/Desktop/VR/final_data.json', 'w') as json_file:
        json_file.write(json_data)

    # Print the JSON data (optional)
    print(json_data)


if __name__ == "__main__":
    # pre_cover_gain()
    to_json()