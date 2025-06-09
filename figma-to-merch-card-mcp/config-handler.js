import { readFileSync, existsSync } from 'fs';
import { join, isAbsolute } from 'path';

export class ConfigHandler {
    constructor(configPath = './config.json') {
        this.config = this.loadConfig(configPath);
        this.resolvedConfig = this.resolveEnvironmentVariables(this.config);
    }

    loadConfig(configPath) {
        try {
            if (!existsSync(configPath)) {
                throw new Error(`Configuration file not found: ${configPath}`);
            }
            const configContent = readFileSync(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.error('Error loading configuration:', error.message);
            throw error;
        }
    }

    resolveEnvironmentVariables(obj) {
        if (typeof obj === 'string') {
            return this.substituteEnvVars(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.resolveEnvironmentVariables(item));
        }

        if (obj && typeof obj === 'object') {
            const resolved = {};
            for (const [key, value] of Object.entries(obj)) {
                resolved[key] = this.resolveEnvironmentVariables(value);
            }
            return resolved;
        }

        return obj;
    }

    substituteEnvVars(str) {
        return str.replace(/\$\{([^}]+)\}/g, (match, varExpression) => {
            const [varName, defaultValue] = varExpression.split(':-');
            const envValue = process.env[varName];

            if (envValue !== undefined) {
                return envValue;
            }

            if (defaultValue !== undefined) {
                return defaultValue;
            }

            if (['PROJECT_ROOT'].includes(varName)) {
                throw new Error(
                    `Required environment variable ${varName} is not set`,
                );
            }

            return match;
        });
    }

    getProjectRoot() {
        const projectRoot = this.resolvedConfig.paths.projectRoot;
        if (!projectRoot || projectRoot.includes('${')) {
            throw new Error(
                'PROJECT_ROOT environment variable is required. Set it to your target project path.',
            );
        }
        return projectRoot;
    }

    resolveOutputPath(outputPath) {
        const projectRoot = this.getProjectRoot();

        if (!outputPath || outputPath === '') {
            outputPath = this.resolvedConfig.paths.outputPath;
        }

        console.log('Resolving output path:', {
            input: outputPath,
            projectRoot: projectRoot,
            configuredOutput: this.resolvedConfig.paths.outputPath,
        });

        if (isAbsolute(outputPath) && existsSync(outputPath)) {
            return outputPath;
        }

        let resolvedPath;

        if (outputPath.startsWith('../')) {
            const cleanPath = outputPath.replace(/^\.\.\//, '');
            resolvedPath = join(projectRoot, cleanPath);
        } else if (outputPath.startsWith('./')) {
            const cleanPath = outputPath.replace(/^\.\//, '');
            resolvedPath = join(projectRoot, cleanPath);
        } else if (outputPath.startsWith('/') && !isAbsolute(outputPath)) {
            const cleanPath = outputPath.substring(1);
            resolvedPath = join(projectRoot, cleanPath);
        } else {
            resolvedPath = join(projectRoot, outputPath);
        }

        const variantsDir = join(resolvedPath, 'variants');
        if (!existsSync(variantsDir)) {
            console.warn(
                `Warning: variants directory not found at ${variantsDir}`,
            );
        }

        console.log(`Resolved output path: ${resolvedPath}`);
        return resolvedPath;
    }

    getStudioPath() {
        const projectRoot = this.getProjectRoot();
        const studioPath = this.resolvedConfig.paths.studioPath;
        return join(projectRoot, studioPath);
    }

    getWebComponentsPath() {
        const projectRoot = this.getProjectRoot();
        const webCompPath = this.resolvedConfig.paths.webComponentsPath;
        return join(projectRoot, webCompPath);
    }

    getVariantPickerPath() {
        const studioPath = this.getStudioPath();
        const variantPickerFile = this.resolvedConfig.files.variantPicker;
        return join(studioPath, variantPickerFile);
    }

    getMasJsPath(outputPath) {
        const resolvedOutputPath = this.resolveOutputPath(outputPath);
        const masJsFile = this.resolvedConfig.files.masJs;
        return join(resolvedOutputPath, masJsFile);
    }

    getFigmaAccessToken(providedToken) {
        const token =
            providedToken ||
            this.resolvedConfig.figma.accessToken ||
            process.env.FIGMA_ACCESS_TOKEN;

        if (!token || token.includes('${')) {
            throw new Error(
                'Figma access token is required. Either:\n' +
                    '1. Set FIGMA_ACCESS_TOKEN environment variable, or\n' +
                    '2. Provide accessToken parameter\n\n' +
                    'To set environment variable:\n' +
                    'export FIGMA_ACCESS_TOKEN=your_token_here',
            );
        }

        return token;
    }

    getBuildConfig() {
        return this.resolvedConfig.build;
    }

    validateConfiguration() {
        try {
            this.getProjectRoot();
            console.log('✅ Configuration validation passed');
            return true;
        } catch (error) {
            console.error('❌ Configuration validation failed:', error.message);
            return false;
        }
    }
} 