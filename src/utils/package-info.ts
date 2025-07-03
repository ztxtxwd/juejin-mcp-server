import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

/**
 * 项目包信息接口
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url: string;
  };
  repository: {
    type: string;
    url: string;
  };
  homepage: string;
  bugs: {
    url: string;
  };
  license: string;
  keywords: string[];
}

/**
 * 读取并解析package.json文件
 */
function loadPackageInfo(): PackageInfo {
  try {
    const packagePath = join(projectRoot, 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      repository: packageJson.repository,
      homepage: packageJson.homepage,
      bugs: packageJson.bugs,
      license: packageJson.license,
      keywords: packageJson.keywords || [],
    };
  } catch (error) {
    console.warn('⚠️ 无法读取package.json，使用默认值:', error);
    // fallback默认值
    return {
      name: 'juejin-mcp-server',
      version: '1.1.0',
      description: '🚀 专为MCP用户设计的掘金内容智能分析工具',
      author: {
        name: 'h7ml',
        email: 'h7ml@qq.com',
        url: 'https://github.com/h7ml',
      },
      repository: {
        type: 'git',
        url: 'git+https://github.com/h7ml/juejin-mcp-server.git',
      },
      homepage: 'https://github.com/h7ml/juejin-mcp-server#readme',
      bugs: {
        url: 'https://github.com/h7ml/juejin-mcp-server/issues',
      },
      license: 'MIT',
      keywords: ['mcp', 'juejin', 'api', 'analytics'],
    };
  }
}

// 单例模式缓存包信息
let cachedPackageInfo: PackageInfo | null = null;

/**
 * 获取项目包信息（缓存版本）
 */
export function getPackageInfo(): PackageInfo {
  if (!cachedPackageInfo) {
    cachedPackageInfo = loadPackageInfo();
  }
  return cachedPackageInfo;
}

/**
 * 获取项目名称
 */
export function getProjectName(): string {
  return getPackageInfo().name;
}

/**
 * 获取项目版本
 */
export function getProjectVersion(): string {
  return getPackageInfo().version;
}

/**
 * 获取项目描述
 */
export function getProjectDescription(): string {
  return getPackageInfo().description;
}

/**
 * 获取作者信息
 */
export function getAuthorInfo() {
  return getPackageInfo().author;
}

/**
 * 获取仓库信息
 */
export function getRepositoryInfo() {
  return getPackageInfo().repository;
}

/**
 * 获取GitHub仓库URL（清理后的）
 */
export function getGitHubUrl(): string {
  const repo = getRepositoryInfo();
  if (repo.url.startsWith('git+')) {
    return repo.url.replace('git+', '').replace('.git', '');
  }
  return repo.url.replace('.git', '');
}

/**
 * 获取项目主页URL
 */
export function getHomepageUrl(): string {
  return getPackageInfo().homepage;
}

/**
 * 获取完整的服务器信息对象
 */
export function getServerInfo() {
  const pkg = getPackageInfo();
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author.name,
    homepage: pkg.homepage,
    protocolVersion: '1.1.0', // MCP协议版本保持固定
  };
}

/**
 * 获取用于CLI显示的品牌信息
 */
export function getBrandInfo() {
  const pkg = getPackageInfo();
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    fullName: `${pkg.name} v${pkg.version}`,
    displayName: '掘金智能聚合MCP服务器',
    githubUrl: getGitHubUrl(),
    homepageUrl: pkg.homepage,
  };
}
