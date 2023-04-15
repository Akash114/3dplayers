import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import MIDISounds from 'midi-sounds-react';

const style = {
    height: 500 // we can control scene size by setting container dimensions
};

class Piano extends Component {

    constructor(props) {
        super(props);
        this.midiNotes=[];
		this.state = {
			selectedInstrument: 192
			,status:'?'
		};
        this.keyMappings = {
            '@': [1+12*2,'Box074'],
            '#': [3+12*2, 'Box73'],
            '%': [6+12*2, 'Box072'],
            '^': [8+12*2, 'Box071'],
            '&': [10+12*2, 'Box070'],

            'S': [1+12*3, 'Box069'],
            'D': [3+12*3, 'Box068'],
            'G': [6+12*3, 'Box067'],
            'H': [8+12*3, 'Box066'],
            'J': [10+12*3, 'Box065'],
            '2': [1+12*4, 'Box064'],
            '3': [3+12*4, 'Box063'],
            '5': [6+12*4, 'Box062'],
            '6': [8+12*4, 'Box061'],
            '7': [10+12*4, 'Box060'],

            's': [1+12*5, 'Box059'],
            'd': [3+12*5, 'Box058'],
            'g': [6+12*5, 'Box057'],
            'h': [8+12*5, 'Box056'],
            'j': [10+12*5, 'Box055'],

            'Q': [0+12*2, 'Box041'],
            'W': [2+12*2, 'Box101'],
            'E': [4+12*2, 'Box100'],
            'R': [5+12*2, 'Box38'],
            'T': [7+12*2, 'Box099'],
            'Y': [9+12*2, 'Box098'],
            'U': [11+12*2, 'Box097'],

            'Z': [0+12*3, 'Box034'],
            'X': [2+12*3, 'Box096'],
            'C': [4+12*3, 'Box095'],
            'V': [5+12*3, 'Box031'],
            'B': [7+12*3, 'Box094'],
            'N': [9+12*3, 'Box093'],
            'M': [11+12*3, 'Box092'],

            'q': [0+12*4, 'Box027'],
            'w': [2+12*4, 'Box091'],
            'e': [4+12*4, 'Box090'],
            'r': [5+12*4, 'Box024'],
            't': [7+12*4, 'Box089'],
            'y': [9+12*4, 'Box088'],
            'u': [11+12*4, 'Box086'],

            'z': [0+12*5, 'Box020'],
            'x': [2+12*5, 'Box087'],
            'c': [4+12*5, 'Box018'],
            'v': [5+12*5, 'Box017'],
            'b': [7+12*5, 'Box085'],
            'n': [9+12*5, 'Box084'],
            'm': [11+12*5, 'Box083'],
            ',': [0+12*6, 'Box013'],

        };
      }
    
    componentDidMount() {
        this.sceneSetup();
        this.addLights();
        this.loadTheModel();
        this.startAnimationLoop();
        document.addEventListener('keydown', this.handleKeyPress);
        document.addEventListener('keyup', this.handleKeyUp);
		this.envelopes=[];				
		this.startListening();
    }    

    onSelectInstrument(e){
		var list=e.target;
		let n = list.options[list.selectedIndex].getAttribute("value");
		this.setState({
			selectedInstrument: n
		});
		this.midiSounds.cacheInstrument(n);
	}

	createSelectItems() {
		if (this.midiSounds) {
			if (!(this.items)) {
				this.items = [];
				for (let i = 0; i < this.midiSounds.player.loader.instrumentKeys().length; i++) {
					this.items.push(<option key={i} value={i}>{'' + (i + 0) + '. ' + this.midiSounds.player.loader.instrumentInfo(i).title}</option>);
				}
			}
			return this.items;
		}
	}
    keyDown(n,v){
		this.keyUp(n);
		var volume=1;
		if(v){
			volume=v;
		}
		this.envelopes[n]=this.midiSounds.player.queueWaveTable(this.midiSounds.audioContext
			, this.midiSounds.equalizer.input
			, window[this.midiSounds.player.loader.instrumentInfo(this.state.selectedInstrument).variable]
			, 0, n, 9999,volume);
		this.setState(this.state);
	}
	keyUp(n){
		if(this.envelopes){
			if(this.envelopes[n]){
				this.envelopes[n].cancel();
				this.envelopes[n]=null;
				this.setState(this.state);
			}
		}
	}

    pressed(n){
		if(this.envelopes){
			if(this.envelopes[n]){
				return true;
			}
		}
		return false;
	}
	midiOnMIDImessage(event){
		var data = event.data;
		var cmd = data[0] >> 4;
		var channel = data[0] & 0xf;
		var type = data[0] & 0xf0;
		var pitch = data[1];
		var velocity = data[2];
		switch (type) {
		case 144:
			this.keyDown(pitch, velocity/127);
			break;
		case 128:
			this.keyUp(pitch);
			break;
		}
	}
	onMIDIOnStateChange(event) {
		this.setState({status:event.port.manufacturer + ' ' + event.port.name + ' ' + event.port.state});
	}
	requestMIDIAccessSuccess(midi){
		console.log(midi);
		var inputs = midi.inputs.values();
		for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
			input.value.onmidimessage = this.midiOnMIDImessage.bind(this);
		}
		midi.onstatechange = this.onMIDIOnStateChange.bind(this);
	}
	requestMIDIAccessFailure(e){
		console.log('requestMIDIAccessFailure', e);
		this.setState({status:'MIDI Access Failure'});
	}
	startListening(){
		this.setState({status:'waiting'});
		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then(this.requestMIDIAccessSuccess.bind(this), this.requestMIDIAccessFailure.bind(this));
		} else {
			this.setState({status:'navigator.requestMIDIAccess undefined'});
		}
	}


    
    


    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
        window.cancelAnimationFrame(this.requestID);
        this.controls.dispose();
    }

    // Standard scene setup in Three.js. Check "Creating a scene" manual for more information
    // https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
    sceneSetup = () => {
        // get container dimensions and use them for scene sizing
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, // fov = field of view
            width / height, // aspect ratio
            0.1, // near plane
            1000 // far plane
        );
        this.camera.position.z = 500; // is used here to set some distance from a cube that is located at z = 0
        // OrbitControls allow a camera to orbit around the object
        // https://threejs.org/docs/#examples/controls/OrbitControls
        this.controls = new OrbitControls( this.camera, this.mount );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( width, height );
        this.mount.appendChild( this.renderer.domElement ); // mount using React ref
    };

    handleKeyPress = (event) => {
        const key = event.key;
        if (key in this.keyMappings) {
          const note = this.keyMappings[key];
          console.log(note);
          const el = this.scene.getObjectByName(note[1]);
            this.keyDown(note[0])
          // // change some custom props of the element: placement, color, rotation, anything that should be
          // // done once the model was loaded and ready for display
        //   el.position.set(0, -150,0 );
        //   el.material.color.set(0x50C878);
          el.rotation.x = -Math.PI / 8;       
    
         }
      };
    
      handleKeyUp = (event) => {
        const key = event.key;
        if (key in this.keyMappings) {
            const note = this.keyMappings[key];

            const el = this.scene.getObjectByName(note[1]);
            this.keyUp(note[0])
            // // change some custom props of the element: placement, color, rotation, anything that should be
            // // done once the model was loaded and ready for display
          //   el.position.set(0, -150,0 );
            // el.material.color.set(0x50C878);
            el.rotation.x = 0;       
          }
      };
    

    // Code below is taken from Three.js OBJ Loader example
    // https://threejs.org/docs/#examples/en/loaders/OBJLoader
    loadTheModel = () => {
        // instantiate a loader
        const loader = new OBJLoader();

        // load a resource
        loader.load(
            // resource URL relative to the /public/index.html of the app
            'Royal.obj',
            // called when resource is loaded
            ( object ) => {
                this.scene.add( object );

                // get the newly added object by name specified in the OBJ model (that is Elephant_4 in my case)
                // you can always set console.log(this.scene) and check its children to know the name of a model
                const el = this.scene.getObjectByName("Box010");

                // // change some custom props of the element: placement, color, rotation, anything that should be
                // // done once the model was loaded and ready for display
                // el.position.set(0, -150,0 );
                // el.material.color.set(0x50C878);
                // el.rotation.x = 23.5;

                // // make this element available inside of the whole component to do any animation later
                this.model = el;
            },
            // called when loading is in progresses
             ( xhr ) => {

                const loadingPercentage = Math.ceil(xhr.loaded / xhr.total * 100);
                console.log( ( loadingPercentage ) + '% loaded' );

                // update parent react component to display loading percentage
                this.props.onProgress(loadingPercentage);
            },
            // called when loading has errors
             ( error ) => {

                console.log( 'An error happened:' + error );

            }
        );
    };

    // adding some lights to the scene
    addLights = () => {
        const lights = [];

        // set color and intensity of lights
        lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

        // place some lights around the scene for best looks and feel
        lights[ 0 ].position.set( 0, 2000, 0 );
        lights[ 1 ].position.set( 1000, 2000, 1000 );
        lights[ 2 ].position.set( - 1000, - 2000, - 1000 );

        this.scene.add( lights[ 0 ] );
        this.scene.add( lights[ 1 ] );
        this.scene.add( lights[ 2 ] );
    };

    startAnimationLoop = () => {
        // slowly rotate an object
        // if (this.model) this.model.rotation.z += 0.005;

        this.renderer.render( this.scene, this.camera );

        // The window.requestAnimationFrame() method tells the browser that you wish to perform
        // an animation and requests that the browser call a specified function
        // to update an animation before the next repaint
        this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
    };

    handleWindowResize = () => {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        this.renderer.setSize( width, height );
        this.camera.aspect = width / height;

        // Note that after making changes to most of camera properties you have to call
        // .updateProjectionMatrix for the changes to take effect.
        this.camera.updateProjectionMatrix();
    };

    render() {
        return (
        <>

<p><select value={this.state.selectedInstrument} onChange={this.onSelectInstrument.bind(this)}>{this.createSelectItems()}</select></p>


        <div style={style} ref={ref => (this.mount = ref)} />
        
		<MIDISounds 
			ref={(ref) => (this.midiSounds = ref)} 
			appElementName="root" 
			instruments={[this.state.selectedInstrument]} 
			/>	

        </>
        
        );
    }
}

export default Piano;