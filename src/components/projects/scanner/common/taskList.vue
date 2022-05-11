<template>
  <div class="task-list-container">
    <el-table :data="taskList" stripe style="width: 100%;">
      <el-table-column prop="scan_id" label="ID" min-width="80" sortable>
        <template slot-scope="scope">
          <router-link
            :to="`/v1/projects/detail/${projectName}/scanner/detail/${scannerName}/task/${scope.row.scan_id}?status=${scope.row.status}&id=${scannerID}`"
            class="task-id"
          >{{ '#' +scope.row.scan_id }}</router-link>
        </template>
      </el-table-column>
      <el-table-column min-width="100" prop="status" label="任务状态">
        <template slot-scope="scope">
          <span
            :class="[`status-${$utils.taskElTagType(scope.row.status)}`]"
          >&nbsp;{{ wordTranslation(scope.row.status,'pipeline','task') }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="120" label="持续时间">
        <template slot-scope="scope">
          <el-icon name="time"></el-icon>
          <span v-if="scope.row.status!=='running'" style="margin-left: 5px;">{{ $utils.timeFormatEn(scope.row.run_time) }}</span>
          <span v-else style="margin-left: 5px;">
            {{ taskDuration(scope.row.scan_id,scope.row.created_at) +
            $utils.timeFormatEn(durationSet[scope.row.scan_id]) }}
            <el-tooltip v-if="durationSet[scope.row.task_id]<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
              <i class="el-icon-warning" style="color: red;"></i>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="执行人" min-width="120">
        <template slot-scope="{ row }">
          <div class="common-column">{{ row.creator }}</div>
          <div class="common-column column-gray">{{ unix(row.created_at).format('MM-DD HH:mm') }}</div>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        layout="prev, pager, next"
        @current-change="changeTaskPage"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import { wordTranslate } from '@utils/wordTranslate.js'
import { unix } from 'moment'
export default {
  data () {
    return {
      durationSet: {},
      unix
    }
  },
  methods: {
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    taskDuration (taskId, started) {
      const refresh = () => {
        const duration = Math.floor(Date.now() / 1000) - started
        this.$set(this.durationSet, taskId, duration)
      }
      setInterval(refresh, 1000)
      return ''
    },
    changeTaskPage (val) {
      this.$emit('currentChange', val)
    }
  },

  props: {
    taskList: {
      required: true,
      type: Array
    },
    scannerName: {
      required: true,
      type: String
    },
    scannerID: {
      required: true,
      type: String
    },
    total: {
      required: false,
      default: 0,
      type: Number
    },
    projectName: {
      required: true,
      default: '',
      type: String
    },
    pageSize: {
      required: false,
      default: 50,
      type: Number
    },
    currentPage: {
      required: false,
      default: 1,
      type: Number
    }
  }
}
</script>

<style lang="less" scoped>
@columnColor: #4a4a4a;

.pagination {
  display: flex;
  justify-content: center;
}

.task-list-container {
  /deep/.el-table {
    color: @columnColor;
  }

  .column-gray {
    color: @fontLightGray;
  }

  .task-id {
    color: @themeColor;
  }
}
</style>
