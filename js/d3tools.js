const SVG = d3.select('#subway_map');
const SVG_HEIGHT = parseInt(SVG.style("height"));
const SVG_WIDTH = parseInt(SVG.style("width"));
let g = SVG.append("g"); //整个图的group
//设置了缩放的范围为0.1到5倍。d3.zoom()函数用于创建一个缩放对象，可以应用于SVG元素上
const ZOOM = d3.zoom().scaleExtent([0.1, 5.0]).on("zoom", zoomed);
SVG.call(ZOOM);
let x_list = Array.from(graph.nodes.values()).map(e => parseInt(e.x)); //获取x坐标的集合
let y_list = Array.from(graph.nodes.values()).map(e => parseInt(e.y)); //获取y坐标的集合
let [min_x, max_x] = [Math.min(...x_list), Math.max(...x_list)]; //获取x坐标的范围
let [min_y, max_y] = [Math.min(...y_list), Math.max(...y_list)]; //获取y坐标的范围

const X_SCALE = d3.scaleLinear().domain([min_x, max_x]).range([-1000, SVG_WIDTH + 900]);
const Y_SCALE = d3.scaleLinear().domain([min_y, max_y]).range([-500, SVG_HEIGHT + 1000]);
const NODE_R = 8; //节点的半径
const NODE_FILL_COR = "white"; //节点的填充色
const NODE_MARGIN_COR = "black"; //节点边框的颜色
const NODE_MARGIN_WID = 3; //节点边框的宽度
const EDGE_MARGIN_WID = 6; //一条边的宽度
const TEXT_SIZE = 8; //站点的标识文字大小
const LINE_TEXT_SIZE = 16; //线的标识文字大小
const LON = {down: 120.51, up: 122.12};
const LAT = {down: 30.40, up: 31.53};

/** 缩放函数 **/
function zoomed(event) {
    const {transform} = event;
    g.attr("transform", transform);
}

/** 画站点 **/
function draw_node(node_name) {
    let Node = graph.nodes.get(node_name);
    let x = X_SCALE(Node.x);
    let y = Y_SCALE(Node.y);
    g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", NODE_R)
        .attr("fill", NODE_FILL_COR)
        .attr("stroke", NODE_MARGIN_COR)
        .attr("stroke-width", NODE_MARGIN_WID)
}

/** 画结点连线 **/
function draw_line(node_name1, node_name2, color = null) {
    let Node1 = graph.nodes.get(node_name1);
    let Node2 = graph.nodes.get(node_name2);
    let [x1, y1] = [X_SCALE(Node1.x), Y_SCALE(Node1.y)];
    let [x2, y2] = [X_SCALE(Node2.x), Y_SCALE(Node2.y)];
    let offset = 0;//画多条边需要偏移
    let edges = graph.get_edges(node_name1, node_name2);
    if (!edges) return;
    for (let edge of edges) {
        let edge_name = edge.name;
        let edge_color = (color === null) ? edge.color : color;
        let mid_x = (x1 + x2) / 2;
        let mid_y = (y1 + y2) / 2;
        // console.log(`edge是:${edge_color}`);console.log(`color是:${color}`)
        g.append("line")
            .attr("x1", x1 + offset)
            .attr("x2", x2 + offset)
            .attr("y1", y1 + offset)
            .attr("y2", y2 + offset)
            .attr("stroke", `#${edge_color}`)
            .attr("stroke-width", EDGE_MARGIN_WID)
            .on("mouseover", function () {
                let node_text = g.append("g");
                node_text.append("text")
                    .text(edge_name)
                    .attr("x", mid_x)
                    .attr("y", mid_y)
                    .attr("font-size", LINE_TEXT_SIZE)
                    .attr("text-anchor", "middle")
            })
            .on("mouseout", function () {
                g.selectAll("g").remove();
            })
        offset += 3;
        if (color !== null) break;

    }
}

/** 根据传入的颜色画边 **/
function draw_line_color(node_name1, node_name2, color) {
    let Node1 = graph.nodes.get(node_name1);
    let Node2 = graph.nodes.get(node_name2);
    let [x1, y1] = [X_SCALE(Node1.x), Y_SCALE(Node1.y)];
    let [x2, y2] = [X_SCALE(Node2.x), Y_SCALE(Node2.y)];

    g.append("line")
        .attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", y1)
        .attr("y2", y2)
        .attr("stroke", color)
        .attr("stroke-width", EDGE_MARGIN_WID);
}

/** 画站点名称 **/
function draw_name(node_name) {
    let Node = graph.nodes.get(node_name);
    let x = X_SCALE(Node.x) + Node.word_x;
    let y = Y_SCALE(Node.y) + Node.word_y;
    g.append("text")
        .text(node_name)
        .attr("x", x)
        .attr("y", y)
        .attr("font-size", TEXT_SIZE);
}

/** 清空图上元素 **/
function clear_map() {
    d3.select('g').selectAll('*').remove();
}

/** 画一条路径的线路图 **/
function draw_path(path, color = null) {
    clear_map();
    let pass_edge = new Set();

    for (let i = 1; i < path.length; i++) {
        let node = path[i - 1];
        let next_node = path[i];
        if (pass_edge.has(node + '-' + next_node) || pass_edge.has(next_node + '-' + node)) continue;
        draw_line(node, next_node, color);
        pass_edge.add(node + '-' + next_node);
        pass_edge.add(next_node + '' + node);
    }
    for (let i = 0; i < path.length; i++) {
        draw_name(path[i]);
        draw_node(path[i]);
    }
}

function draw_total_line(line_name, color) {
    clear_map();
    let pass_edge = new Set();
    for (let node_name of graph.nodes_of_line) {
        let Node = graph.nodes.get(node_name);
        for (let next_node of Node.edges.keys()) {
            if (pass_edge.has(node_name + '-' + next_node)) continue;
            if (graph.nodes_of_line.has(next_node)) {
                draw_line(node_name, next_node, color);
                pass_edge.add(node_name + '-' + next_node);
                pass_edge.add(next_node + '-' + node_name);
            }
        }
        draw_node(node_name);
    }
    for (let node_name of graph.nodes_of_line) {
        draw_name(node_name);
    }
}

/** 画整张地图 **/
function draw_map() {
    clear_map();
    let pass_edge = new Set();
    for (let Node of graph.nodes.values()) {
        for (let next_node of Node.edges.keys()) {
            if (pass_edge.has(Node.name + '-' + next_node)) continue;
            // draw_line(Node.name, next_node,'ff0000');
            draw_line(Node.name, next_node,);
            pass_edge.add(Node.name + '-' + next_node);
            pass_edge.add(next_node + '-' + Node.name);
        }
        draw_node(Node.name);
    }
    for (let Node of graph.nodes.values()) {
        draw_name(Node.name);
    }
}
