#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成微信小程序tabBar图标
使用PIL库绘制简单的矢量风格图标
"""

from PIL import Image, ImageDraw

# 图标配置
ICON_SIZE = 81
GRAY_COLOR = "#999999"
BLUE_COLOR = "#1989fa"
BG_COLOR = (0, 0, 0, 0)  # 透明背景


def create_home_icon(draw, color):
    """绘制房子图标"""
    # 房子主体轮廓
    margin = 16
    center_x = ICON_SIZE // 2
    roof_top_y = 18
    house_bottom_y = ICON_SIZE - margin
    house_left_x = margin + 4
    house_right_x = ICON_SIZE - margin - 4
    roof_bottom_y = 38

    # 屋顶（三角形）
    roof_points = [
        (center_x, roof_top_y),           # 顶点
        (house_left_x - 6, roof_bottom_y),  # 左下
        (house_right_x + 6, roof_bottom_y), # 右下
    ]
    draw.polygon(roof_points, fill=color)

    # 房子主体（矩形）
    body_left = house_left_x
    body_right = house_right_x
    body_top = roof_bottom_y - 2
    body_bottom = house_bottom_y
    draw.rectangle([body_left, body_top, body_right, body_bottom], fill=color)

    # 门
    door_width = 14
    door_height = 18
    door_left = center_x - door_width // 2
    door_right = center_x + door_width // 2
    door_top = house_bottom_y - door_height
    door_bottom = house_bottom_y
    draw.rectangle([door_left, door_top, door_right, door_bottom], fill=BG_COLOR)


def create_requirement_icon(draw, color):
    """绘制文档/列表图标"""
    margin = 18
    paper_left = margin
    paper_right = ICON_SIZE - margin
    paper_top = 14
    paper_bottom = ICON_SIZE - 14

    # 纸张主体（圆角矩形）
    draw.rounded_rectangle(
        [paper_left, paper_top, paper_right, paper_bottom],
        radius=4,
        fill=color
    )

    # 右上角折角效果（用三角形模拟）
    fold_size = 10
    fold_points = [
        (paper_right - fold_size, paper_top),
        (paper_right, paper_top),
        (paper_right, paper_top + fold_size),
    ]
    # 折角用稍深的颜色或留白效果
    # 这里我们用背景色画一个小三角形表示折角
    draw.polygon(fold_points, fill=BG_COLOR)

    # 列表线条
    line_left = paper_left + 10
    line_right = paper_right - 10
    line_color = BG_COLOR  # 白色/透明线条

    # 三条列表线
    line_y_positions = [30, 42, 54]
    line_widths = [2, 2, 2]
    for i, y in enumerate(line_y_positions):
        # 第一条短一点，像列表项
        if i == 0:
            draw.rectangle([line_left, y, line_right - 10, y + 3], fill=line_color)
        else:
            draw.rectangle([line_left, y, line_right, y + 3], fill=line_color)


def create_profile_icon(draw, color):
    """绘制用户头像图标"""
    center_x = ICON_SIZE // 2
    center_y = ICON_SIZE // 2

    # 头部（圆形）
    head_radius = 12
    head_center_y = center_y - 10
    draw.ellipse(
        [center_x - head_radius, head_center_y - head_radius,
         center_x + head_radius, head_center_y + head_radius],
        fill=color
    )

    # 身体/肩膀（用圆弧或梯形表示）
    body_top = head_center_y + head_radius - 2
    body_bottom = ICON_SIZE - 14
    body_width_top = 16
    body_width_bottom = 30

    # 绘制身体（圆角梯形）
    body_points = [
        (center_x - body_width_top, body_top),
        (center_x + body_width_top, body_top),
        (center_x + body_width_bottom, body_bottom),
        (center_x - body_width_bottom, body_bottom),
    ]
    draw.polygon(body_points, fill=color)

    # 给头部和身体之间做一点圆角处理
    # 用圆形裁剪让连接处更平滑
    neck_y = body_top + 4
    draw.ellipse(
        [center_x - body_width_top, neck_y - 4,
         center_x + body_width_top, neck_y + 4],
        fill=color
    )


def generate_icon(draw_func, color, filename):
    """生成单个图标并保存"""
    # 创建透明背景的图像
    img = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 绘制图标
    draw_func(draw, color)

    # 保存为PNG
    img.save(filename, "PNG")
    print(f"已生成: {filename}")


def main():
    """主函数：生成所有tabBar图标"""
    import os

    output_dir = os.path.dirname(os.path.abspath(__file__))

    # 定义图标配置
    icons = [
        # (绘制函数, 颜色, 文件名)
        (create_home_icon, GRAY_COLOR, "home.png"),
        (create_home_icon, BLUE_COLOR, "home-active.png"),
        (create_requirement_icon, GRAY_COLOR, "requirement.png"),
        (create_requirement_icon, BLUE_COLOR, "requirement-active.png"),
        (create_profile_icon, GRAY_COLOR, "profile.png"),
        (create_profile_icon, BLUE_COLOR, "profile-active.png"),
    ]

    print("=" * 50)
    print("开始生成微信小程序tabBar图标")
    print(f"输出目录: {output_dir}")
    print(f"图标尺寸: {ICON_SIZE}x{ICON_SIZE}")
    print("=" * 50)

    for draw_func, color, filename in icons:
        filepath = os.path.join(output_dir, filename)
        generate_icon(draw_func, color, filepath)

    print("=" * 50)
    print("所有图标生成完成！")
    print("=" * 50)


if __name__ == "__main__":
    main()
