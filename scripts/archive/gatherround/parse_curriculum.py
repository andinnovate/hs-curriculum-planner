import csv
import os

def parse_curriculum_csv(filepath, year):
    """Parse a curriculum CSV file and extract unit, subcategory, hours relationships."""
    results = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    # Row 0 has unit names in columns 1+
    # Row 1 has category name (e.g. "Physical Science") with "Hours" labels
    # Subsequent rows have subcategories with hours
    
    unit_names = rows[0][1:]  # Skip first column (UNIT label)
    
    # Known category names that appear as row headers
    categories = [
        'Physical Science', 'Earth Science', 'Life Science', 'Language Arts',
        'History', 'Bible', 'Physical Education', 'Fine Arts', 'Electives',
        'Social Science Electives', 'Language Arts Electives', 'Science Electives',
        'Math Electives'
    ]
    
    # Categories that also have hours directly (no subcategories)
    categories_with_hours = ['Bible', 'Physical Education']
    
    current_category = None
    
    for row_idx, row in enumerate(rows[1:], start=1):  # Start from row 1 (Physical Science)
        if not row or not row[0].strip():
            continue
            
        name = row[0].strip().replace('\n', ' ')
        
        # Skip rows that are clearly not data (TOTALS, Required Reading, etc.)
        if name.upper().startswith('TOTALS') or name.startswith('Required') or name.startswith('('):
            continue
        
        # Check if this is a category header
        is_category = name in categories
        
        if is_category:
            current_category = name
            # For Bible and Physical Education, they ARE the subcategory too
            if name not in categories_with_hours:
                continue
        
        # Check if this row has any numeric hour values (not just "Hours" labels)
        hour_values = row[1:]
        has_numeric_hours = any(
            val.strip() and val.strip() != 'Hours' and is_numeric(val.strip())
            for val in hour_values if val
        )
        
        if not has_numeric_hours:
            continue  # Skip rows with no numeric data
        
        # This is a subcategory with hours
        # For categories like Bible/Physical Education, use category name as subcategory
        subcategory = name
        
        for col_idx, hours_str in enumerate(hour_values):
            if col_idx >= len(unit_names):
                break
                
            unit_name = unit_names[col_idx].strip().replace('\n', ' ')
            
            # Skip TOTALS column
            if unit_name.upper() == 'TOTALS':
                continue
            
            hours_str = hours_str.strip() if hours_str else ''
            
            if hours_str and hours_str != 'Hours':
                try:
                    hours = float(hours_str)
                    if hours > 0:
                        results.append({
                            'year': year,
                            'unit': unit_name,
                            'category': current_category,
                            'subcategory': subcategory,
                            'hours': hours
                        })
                except ValueError:
                    pass  # Skip non-numeric values
    
    return results

def is_numeric(s):
    """Check if a string represents a number."""
    try:
        float(s)
        return True
    except ValueError:
        return False

def main():
    all_data = []
    
    # Process all 4 year files
    for year in range(1, 5):
        filepath = f'gather round year {year} - Sheet1.csv'
        if os.path.exists(filepath):
            data = parse_curriculum_csv(filepath, year)
            all_data.extend(data)
            print(f"Year {year}: {len(data)} records")
    
    # Write output CSV
    output_file = 'unit_subcategory_hours.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['year', 'unit', 'category', 'subcategory', 'hours'])
        for record in all_data:
            writer.writerow([
                record['year'],
                record['unit'],
                record['category'],
                record['subcategory'],
                record['hours']
            ])
    
    print(f"\nTotal records: {len(all_data)}")
    print(f"Output written to: {output_file}")
    
    # Also print a summary
    print("\n--- Sample data (first 20 records) ---")
    for record in all_data[:20]:
        print(f"Year {record['year']} | {record['unit'][:25]:<25} | {record['subcategory']:<25} | {record['hours']} hrs")

if __name__ == '__main__':
    main()
