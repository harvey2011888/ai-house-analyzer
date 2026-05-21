#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳政府数据开放平台 - 房地产成交数据下载脚本
下载最近半年的二手房和一手商品房成交信息
"""

import requests
import json
import csv
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any

# API配置
BASE_URL = "https://opendata.sz.gov.cn/api"
APP_KEY = "ab3cbc0e4b574adda096b3b47be57afa"

# 数据集ID
SECOND_HAND_API_ID = "29200_01903513"  # 二手房成交信息
NEW_HOUSE_API_ID = "29200_01903510"    # 一手商品房成交信息

# 请求参数
PAGE_SIZE = 1000  # 每页最大记录数


def fetch_data(api_id: str, page: int = 1, rows: int = 1000) -> Dict[str, Any]:
    """
    从深圳政府数据开放平台获取数据
    
    Args:
        api_id: API接口ID
        page: 页码
        rows: 每页记录数
    
    Returns:
        API响应数据
    """
    url = f"{BASE_URL}/{api_id}/1/service.xhtml"
    params = {
        "page": page,
        "rows": rows,
        "appKey": APP_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        return {}
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")
        return {}


def fetch_all_data(api_id: str, data_name: str) -> List[Dict[str, Any]]:
    """
    获取所有数据（处理分页）
    
    Args:
        api_id: API接口ID
        data_name: 数据名称（用于日志）
    
    Returns:
        所有记录列表
    """
    all_data = []
    page = 1
    
    print(f"开始获取 {data_name} 数据...")
    
    while True:
        print(f"  正在获取第 {page} 页数据...")
        result = fetch_data(api_id, page=page, rows=PAGE_SIZE)
        
        if not result or "data" not in result:
            print(f"  第 {page} 页无数据，停止获取")
            break
        
        data = result.get("data", [])
        if not data:
            print(f"  第 {page} 页数据为空，停止获取")
            break
        
        all_data.extend(data)
        print(f"  第 {page} 页获取成功，本页 {len(data)} 条记录，总计 {len(all_data)} 条")
        
        # 如果本页数据少于PAGE_SIZE，说明已经获取完所有数据
        if len(data) < PAGE_SIZE:
            break
        
        page += 1
    
    print(f"{data_name} 数据获取完成，共 {len(all_data)} 条记录")
    return all_data


def filter_recent_half_year(data: List[Dict[str, Any]], date_field: str = "TJ_DATE") -> List[Dict[str, Any]]:
    """
    筛选最近半年的数据
    
    Args:
        data: 原始数据列表
        date_field: 日期字段名
    
    Returns:
        最近半年的数据列表
    """
    # 计算半年前的日期
    half_year_ago = datetime.now() - timedelta(days=180)
    
    filtered_data = []
    for item in data:
        date_str = item.get(date_field, "")
        if not date_str:
            continue
        
        try:
            # 尝试解析日期（格式可能是 YYYY-MM-DD 或 YYYY/MM/DD）
            date_str = date_str.replace("/", "-")
            item_date = datetime.strptime(date_str, "%Y-%m-%d")
            
            if item_date >= half_year_ago:
                filtered_data.append(item)
        except ValueError:
            # 日期格式不匹配，保留该记录
            filtered_data.append(item)
    
    return filtered_data


def save_to_csv(data: List[Dict[str, Any]], filename: str):
    """
    将数据保存为CSV文件
    
    Args:
        data: 数据列表
        filename: 输出文件名
    """
    if not data:
        print(f"警告: 没有数据可保存到 {filename}")
        return
    
    # 确保输出目录存在
    output_dir = os.path.dirname(filename)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 获取所有字段名
    fieldnames = list(data[0].keys())
    
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"数据已保存到: {filename}")


def save_to_json(data: List[Dict[str, Any]], filename: str):
    """
    将数据保存为JSON文件
    
    Args:
        data: 数据列表
        filename: 输出文件名
    """
    if not data:
        print(f"警告: 没有数据可保存到 {filename}")
        return
    
    # 确保输出目录存在
    output_dir = os.path.dirname(filename)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已保存到: {filename}")


def main():
    """主函数"""
    # 设置输出目录
    output_dir = "d:\\buy\\ai赚钱计划\\ai-house-analyzer\\data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 获取当前日期
    today = datetime.now().strftime("%Y%m%d")
    
    print("=" * 60)
    print("深圳房地产成交数据下载工具")
    print("=" * 60)
    
    # 1. 获取二手房成交数据
    print("\n【1】获取二手房成交信息...")
    second_hand_data = fetch_all_data(SECOND_HAND_API_ID, "二手房成交信息")
    
    if second_hand_data:
        # 筛选最近半年数据
        recent_second_hand = filter_recent_half_year(second_hand_data)
        print(f"最近半年二手房成交数据: {len(recent_second_hand)} 条")
        
        # 保存数据
        second_hand_csv = os.path.join(output_dir, f"second_hand_house_{today}.csv")
        second_hand_json = os.path.join(output_dir, f"second_hand_house_{today}.json")
        save_to_csv(recent_second_hand, second_hand_csv)
        save_to_json(recent_second_hand, second_hand_json)
    
    # 2. 获取一手商品房成交数据
    print("\n【2】获取一手商品房成交信息...")
    new_house_data = fetch_all_data(NEW_HOUSE_API_ID, "一手商品房成交信息")
    
    if new_house_data:
        # 筛选最近半年数据
        recent_new_house = filter_recent_half_year(new_house_data)
        print(f"最近半年一手商品房成交数据: {len(recent_new_house)} 条")
        
        # 保存数据
        new_house_csv = os.path.join(output_dir, f"new_house_{today}.csv")
        new_house_json = os.path.join(output_dir, f"new_house_{today}.json")
        save_to_csv(recent_new_house, new_house_csv)
        save_to_json(recent_new_house, new_house_json)
    
    print("\n" + "=" * 60)
    print("数据下载完成！")
    print(f"输出目录: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
