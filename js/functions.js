function init() {
    graph.load_data();
    draw_map();
}

init();
/** 全局vue组件 **/
var functions = new Vue({
    el: "#left_area",
    data: {
        act: 0,
        node: {
            name: '',
            name_del: '',
            lon: '', //经度
            lat: '', //纬度
        },
        line: {
            name: '',
            color: '#ff0000',
        },
        lines: [],
        select_line: {
            name: '',
            color: '',
        },
        node1: '',
        node2: '',
        begin_node: '',
        end_node: "",
        path: {
            show: 0,
            detail: [],
        }
    },
    created() {
        this.update_select();
    },
    methods: {
        /**
         * 将经纬度转换为米勒投影平面坐标
         * @param {number} lon 经度
         * @param {number} lat 纬度
         * @returns {number[]} 平面坐标 [x, y]
         */
        switch_coord(lon, lat) {
            const earthCircumference = 40075016.686; // 地球赤道周长，单位：米
            const W = earthCircumference; // 平面展开后，x轴等于赤道周长
            const H = earthCircumference / 2; // 展开后y轴等于赤道周长的一半
            const millerConstant = 2.3; // 米勒投影中的一个常数
            const x = (W / 2) + (W / (2 * Math.PI)) * (lon * Math.PI / 180); // 经度转换
            // 将纬度从度数转换为弧度，并进行米勒投影的转换
            let y = lat * Math.PI / 180;
            y = 1.25 * Math.log(Math.tan(0.25 * Math.PI + 0.4 * y));
            // 弧度转换为实际距离，结果的单位为米
            y = (H / 2) - (H / (2 * millerConstant)) * y;
            return [x, y];
        },

        /** 切换面板的函数 **/
        switch_board(val) {
            this.act = val;
        },

        /**************************更改地图****************************/
        /** 增加结点**/
        add_node() {
            if (this.node.name === '' || this.node.lat === '' || this.node.lon === '') {
                alert("请输入完整有效的信息");
                this.node.name = '';
                this.node.lon = '';
                this.node.lat = '';
            } else {
                let lon = parseFloat(this.node.lon);
                let lat = parseFloat(this.node.lat);
                if (lon >= LON.down && lon <= LON.up &&
                    lat >= LAT.down && lat <= LAT.up) {
                    let [x, y] = this.switch_coord(lon, lat);
                    if (graph.add_node(this.node.name, x, y, [])) {
                        draw_map();
                        alert(`添加${this.node.name}成功\n经度是${lon},纬度是${lat}`);
                        this.node.lon = '';
                        this.node.lat = '';
                    } else {
                        alert("添加失败,请检查输入数据");
                    }
                } else {
                    alert("添加点不在地图范围内,添加失败");

                }
            }
        },

        /** 删除节点 **/
        delete_node(node_name) {
            // alert(`删除的结点名称是:${node_name}`)
            if (node_name === '') alert("删除站点不能为空")
            else {
                if (graph.remove_node(node_name)) {
                    draw_map();
                    alert(`${node_name}删除成功`)
                } else {
                    alert(`没有站点${node_name}\n 删除失败`)
                }
                this.node.name_del = '';
            }
        },

        /** 增加线路 **/
        add_line() {
            if (this.line.name === '') {
                alert("增加线路的名字不能为空");
            } else {
                if (graph.lines.has(this.line.name)) {
                    alert(`已经存在${this.line.name}线路`);
                } else {
                    let color = this.line.color.substring(1);
                    console.log(color);
                    graph.add_line(this.line.name, color);
                    alert(`添加${this.line.name}成功`);
                    this.update_select();
                    this.line.name = '';
                }
            }
        },

        /** 更新线路 **/
        update_select() {
            this.lines = [];
            for (const line of graph.lines.values()) {
                this.lines.push({name: line.name, color: line.color})
            }
        },

        /** 向线路增加边 **/
        add_edge_to_line() {
            if (this.node1 === '' || this.node2 === '') {
                alert(`站点名称不能为空`);
            } else {
                if (!graph.nodes.has(this.node1) || !graph.nodes.has(this.node2)) {
                    alert("请检查输入为地图中已经拥有的站点");
                } else if (this.node1 === this.node2) {
                    alert("站点1 和 站点2 不能相同")
                } else {
                    let status = graph.add_edge_to_line(this.node1, this.node2, this.select_line.name);
                    console.log(`边的名字是:${this.select_line.name}`)
                    draw_map();
                    alert(`添加${this.node1} ----${this.node2}成功`);
                    this.node1 = '';
                    this.node2 = '';
                }
            }
        },
        /****************************查询换乘*****************************/
        /** 查看某条地铁线路 **/
        select_one_line() {
            if (!this.select_line.name || !graph.lines.has(this.select_line.name))
                alert("请输入已经存在的地铁线");
            else {
                let color = graph.select_line(this.select_line.name);
                // console.log(`color是${color}`);
                // console.log(`path是${graph.nodes_of_line}`)
                draw_total_line(this.select_line.name, color);
                alert(`${this.select_line.name}--查询完毕,请在图中查看`)
            }
        },

        /** 加载最短路径 **/
        show_info() {
            let path = [];
            if (graph.nodes.get(this.begin_node) && graph.nodes.get(this.end_node)) {
                // console.log(graph.nodes);
                graph.get_path(this.begin_node, this.end_node);
                for( let item of graph.path){
                    let line = graph.nodes.get(item).pass_line;
                    console.log(line);
                    path.push({name:item , of_line:line});
                }
                this.path.show = 1;
                this.path.detail = path;
                console.log(this.path.detail);
            } else {
                alert("未在图中找到相关的站点");
            }

        },
        show_path() {
            if (graph.nodes.get(this.begin_node) && graph.nodes.get(this.end_node)) {
                console.log(this.begin_node, this.end_node);
                draw_path(graph.path);
            }else{
                alert("未在图中找到相关的站点");
            }
        }
    }
})

var bars = new Vue({
    el:"#tab",
    data:{

    },
    methods: {
        big(){
            ZOOM.scaleBy(SVG,1.1);
            d3.zoomTransform(SVG.node());
        },
        small(){
            ZOOM.scaleBy(SVG,0.9);
            d3.zoomTransform(SVG.node());
        },
        clear(){
            graph.clean_data();
            draw_map();
        },
        reload(){
            graph.clean_data(); //将地图清空
            graph.load_data(); //重新读取完整数据
            draw_map();
        }

    }
})